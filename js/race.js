// ============================================================
// NITRO FORGE - Race Engine
// ============================================================

class Race {
  constructor(canvas, playerCar, opponentDef) {
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d');
    this.playerCar   = playerCar;
    this.opponentDef = opponentDef;
    this.opponentCar = this._buildOpponentCar(opponentDef);

    this.state       = 'staging'; // staging | countdown | racing | finished
    this.treeState   = 'off';     // off | pre | stage | a1 | a2 | a3 | go | red
    this.treeTimer   = 0;
    this._rewardGiven = false;
    this.results     = null;
    this.endTimer    = 0;

    // Launch mechanics
    this.launchRPM   = 0;
    this.stagingTimer = 0;

    // Camera
    this.camX        = 0;

    // Particles
    this.particles   = [];

    // BG
    this.stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 200,
      s: Math.random() * 1.5 + 0.5,
    }));
    this.buildings = Array.from({ length: 30 }, (_, i) => ({
      x: i * 90 + Math.random() * 40,
      w: 40 + Math.random() * 40,
      h: 30 + Math.random() * 80,
    }));
  }

  _buildOpponentCar(def) {
    const carData = GAME_DATA.cars.find(c => c.id === def.carId);
    const mods = [];
    if (def.modsLevel >= 1) mods.push('eng1', 'tires1', 'trans1');
    if (def.modsLevel >= 2) mods.push('eng2', 'turbo1', 'tires2', 'trans2');
    if (def.modsLevel >= 3) mods.push('eng3', 'turbo2', 'tires3', 'trans3', 'nos1');
    const car = new Car(carData, mods);
    car.isOpponent  = true;
    car.difficulty  = def.difficulty;
    car.aiShiftRPM  = carData.stats.powerband[1] * 0.88 * def.difficulty;
    car.aiNOSChance = def.modsLevel >= 2 ? 0.008 : 0;
    return car;
  }

  // ── Update ─────────────────────────────────────────────────────────

  update(dt, input) {
    this._updateTree(dt, input);
    this._updateParticles(dt);

    if (this.state === 'racing') {
      // Player
      this.playerCar.update(dt, input.throttle ? 1.0 : 0.2);
      if (input.shiftPressed) this.playerCar.shiftUp();
      if (input.nosPressed)   this.playerCar.activateNOS();

      // Opponent AI
      this._opponentAI(dt);
      this.opponentCar.update(dt, 1.0);

      // Audio
      AudioEngine.updateEngine(this.playerCar.rpm, this.playerCar.redline, true);

      // Wheel slip particles
      if (this.playerCar.wheelSlip && Math.random() < 0.4) {
        this._spawnSmoke(
          this.playerCar.distance * Race.WORLD_SCALE + 25,
          Race.ROAD_Y + Race.ROAD_H * 0.28 + 20
        );
      }

      // Camera: smoothly follow player
      const targetCam = this.playerCar.distance * Race.WORLD_SCALE - this.canvas.width * 0.28;
      this.camX += (targetCam - this.camX) * Math.min(1, dt * 8);

      // Race end logic
      const pDone = this.playerCar.finished || this.playerCar.disqualified;
      const oDone = this.opponentCar.finished;

      if (pDone && oDone) {
        this._endRace();
      } else if (pDone) {
        this.endTimer += dt;
        if (this.endTimer > 2.5) this._endRace();
      } else if (oDone) {
        this.endTimer += dt;
        if (this.endTimer > 4.0) this._endRace();
      }
    }

    if (this.state === 'staging') {
      this.stagingTimer += dt;
      // Build launch RPM while holding
      if (input.launch) {
        this.launchRPM = Math.min(
          this.playerCar.redline * 0.88,
          this.launchRPM + this.playerCar.redline * 1.8 * dt
        );
      } else {
        this.launchRPM = Math.max(0, this.launchRPM - this.playerCar.redline * 0.8 * dt);
      }
      // Idle engine sound
      AudioEngine.updateEngine(800 + this.launchRPM * 0.3, this.playerCar.redline, true);

      if (this.stagingTimer > 1.2 && this.treeState === 'off') {
        this.treeState = 'pre';
        this.treeTimer = 0;
        AudioEngine.playBeep(440, 0.08);
      }
    }
  }

  _opponentAI(dt) {
    const c = this.opponentCar;
    if (!c.launched) return;
    if (c.rpm >= c.aiShiftRPM && !c.shifting && c.gear < c.numGears) {
      if (Math.random() < 0.7) c.shiftUp();
    }
    if (c.aiNOSChance > 0 && c.nosUsesLeft > 0 && !c.nosActive && c.distance > 300) {
      if (Math.random() < c.aiNOSChance) c.activateNOS();
    }
  }

  _updateTree(dt, input) {
    const S = this.treeState;
    if (S === 'off' || S === 'go' || S === 'red') return;

    this.treeTimer += dt;

    const sequence = {
      pre:   { dur: 0.6,  next: 'stage' },
      stage: { dur: 0.5,  next: 'a1'   },
      a1:    { dur: 0.45, next: 'a2'   },
      a2:    { dur: 0.45, next: 'a3'   },
      a3:    { dur: 0.45, next: 'go'   },
    };

    const cur = sequence[S];
    if (!cur) return;

    if (this.treeTimer >= cur.dur) {
      this.treeTimer = 0;
      const nextState = cur.next;

      if (nextState === 'go') {
        this.treeState = 'go';
        this.state     = 'racing';

        // Launch quality
        const optRPM = this.playerCar.redline * 0.62;
        const diff   = Math.abs(this.launchRPM - optRPM) / this.playerCar.redline;
        let bonus;
        if      (diff < 0.04) bonus = 1.18;
        else if (diff < 0.12) bonus = 1.06;
        else if (diff < 0.25) bonus = 0.92;
        else                  bonus = 0.78;

        this.playerCar.launched   = true;
        this.playerCar.rpm        = Math.max(this.launchRPM, 2000);
        this.playerCar.speed      = bonus * 4;
        this.playerCar.launchBonus = bonus;

        this.opponentCar.launched  = true;
        this.opponentCar.rpm       = this.opponentCar.powerband?.[0] || 3000;
        this.opponentCar.speed     = 5;
        this.opponentCar.launchBonus = 1.0;

        AudioEngine.playGo();
        this.perfectLaunch = diff < 0.04;
        return;
      }

      // Beep on each amber
      if (['a1','a2','a3'].includes(nextState)) {
        AudioEngine.playBeep(660, 0.1);
      }
      this.treeState = nextState;
    }

    // False start detection (launch input during amber sequence)
    if (['a1','a2','a3'].includes(S) && input.launchPressed) {
      this.treeState = 'red';
      this.playerCar.disqualified = true;
      AudioEngine.playBeep(220, 0.5);
    }
  }

  _endRace() {
    if (this.state === 'finished') return;
    this.state = 'finished';
    AudioEngine.stopEngine();

    const pT  = this.playerCar.finishTime  || 999;
    const oT  = this.opponentCar.finishTime || 999;
    const dq  = this.playerCar.disqualified;
    const won = !dq && pT < oT;

    this.results = {
      won,
      disqualified: dq,
      playerTime:   pT,
      opponentTime: oT,
      playerSpeed:  this.playerCar.finishSpeed || this.playerCar.speed,
      reward:       won
        ? this.opponentDef.reward
        : Math.floor(this.opponentDef.reward * 0.05),
    };

    if (won) AudioEngine.playWin(); else AudioEngine.playLose();
  }

  // ── Particles ──────────────────────────────────────────────────────

  _spawnSmoke(wx, wy) {
    this.particles.push({
      wx, wy,
      vx: -Math.random() * 40 - 20,
      vy: -Math.random() * 20,
      life: 1.0, maxLife: 1.0,
      r: 8 + Math.random() * 12,
    });
  }

  _updateParticles(dt) {
    for (const p of this.particles) {
      p.wx += p.vx * dt;
      p.wy += p.vy * dt;
      p.life -= dt * 1.5;
      p.r += dt * 10;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  // ── Draw ───────────────────────────────────────────────────────────

  static get WORLD_SCALE() { return 0.75; }   // pixels per foot
  static get ROAD_Y()      { return 230; }
  static get ROAD_H()      { return 180; }

  draw() {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    this._drawBG(ctx, W, H);
    this._drawRoad(ctx, W, H);
    this._drawParticles(ctx);
    this._drawCars(ctx, W, H);
    this._drawHUD(ctx, W, H);
    this._drawTree(ctx, W, H);
    if (this.state === 'finished') this._drawResults(ctx, W, H);
  }

  _drawBG(ctx, W, H) {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, Race.ROAD_Y);
    sky.addColorStop(0, '#04030d');
    sky.addColorStop(1, '#0b0622');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, Race.ROAD_Y);

    // Stars
    ctx.fillStyle = '#fff';
    for (const st of this.stars) {
      const sx = ((st.x - this.camX * 0.04) % (W + 200) + W + 200) % (W + 200) - 100;
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.001 + st.x) * 0.3;
      ctx.beginPath();
      ctx.arc(sx, st.y, st.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // City silhouette
    ctx.fillStyle = '#0d0b1e';
    const bOff = (-this.camX * 0.08) % 2700;
    for (const b of this.buildings) {
      const bx = ((b.x + bOff) % 2700) - 100;
      ctx.fillRect(bx, Race.ROAD_Y - b.h, b.w, b.h);
      // Random lit windows
      ctx.fillStyle = 'rgba(255,220,100,0.4)';
      for (let wy = b.h - 10; wy > 5; wy -= 14) {
        for (let wx = 4; wx < b.w - 4; wx += 10) {
          if (Math.abs(Math.sin(b.x + wx + wy)) > 0.3) {
            ctx.fillRect(bx + wx, Race.ROAD_Y - b.h + wy, 5, 7);
          }
        }
      }
      ctx.fillStyle = '#0d0b1e';
    }

    // Ground strip below road
    ctx.fillStyle = '#0a0918';
    ctx.fillRect(0, Race.ROAD_Y + Race.ROAD_H, W, H - Race.ROAD_Y - Race.ROAD_H);
  }

  _drawRoad(ctx, W, H) {
    const rY = Race.ROAD_Y, rH = Race.ROAD_H;

    // Road surface
    const rg = ctx.createLinearGradient(0, rY, 0, rY + rH);
    rg.addColorStop(0, '#17152a');
    rg.addColorStop(1, '#0e0d1c');
    ctx.fillStyle = rg;
    ctx.fillRect(0, rY, W, rH);

    // Edge lines
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, rY); ctx.lineTo(W, rY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, rY + rH); ctx.lineTo(W, rY + rH); ctx.stroke();

    // Dividing line (dashed)
    ctx.save();
    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth = 2;
    ctx.setLineDash([50, 70]);
    ctx.lineDashOffset = -this.camX * Race.WORLD_SCALE % 120;
    ctx.beginPath(); ctx.moveTo(0, rY + rH * 0.5); ctx.lineTo(W, rY + rH * 0.5); ctx.stroke();
    ctx.restore();

    // Starting line
    const startX = -this.camX * Race.WORLD_SCALE + W * 0.25;
    if (startX > -40 && startX < W + 40) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(startX, rY); ctx.lineTo(startX, rY + rH); ctx.stroke();
    }

    // Finish line (1320 ft)
    const finX = 1320 * Race.WORLD_SCALE - this.camX * Race.WORLD_SCALE + W * 0.25;
    if (finX > -80 && finX < W + 80) {
      const cSize = 12;
      const rows  = Math.ceil(rH / cSize);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 5; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#fff' : '#000';
          ctx.fillRect(finX + c * cSize, rY + r * cSize, cSize, cSize);
        }
      }
    }

    // Distance markers every 100 ft
    for (let d = 100; d < 1320; d += 100) {
      const mx = d * Race.WORLD_SCALE - this.camX * Race.WORLD_SCALE + W * 0.25;
      if (mx < 0 || mx > W) continue;
      ctx.fillStyle = '#ffffff22';
      ctx.fillRect(mx, rY, 1, rH);
      ctx.fillStyle = '#ffffff44';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d + 'ft', mx, rY + 12);
    }
  }

  _drawParticles(ctx) {
    for (const p of this.particles) {
      const sx = p.wx - this.camX * Race.WORLD_SCALE + this.canvas.width * 0.25;
      ctx.globalAlpha = p.life / p.maxLife * 0.6;
      ctx.fillStyle = '#aaaaaa';
      ctx.beginPath();
      ctx.arc(sx, p.wy, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _drawCars(ctx, W, H) {
    const rY = Race.ROAD_Y, rH = Race.ROAD_H;

    const pSX = this.playerCar.distance   * Race.WORLD_SCALE - this.camX * Race.WORLD_SCALE + W * 0.25;
    const oSX = this.opponentCar.distance * Race.WORLD_SCALE - this.camX * Race.WORLD_SCALE + W * 0.25;

    const pSY = rY + rH * 0.28;
    const oSY = rY + rH * 0.72;

    this.opponentCar.draw(ctx, oSX, oSY, false);
    this.playerCar.draw(ctx, pSX, pSY, false);
  }

  _drawHUD(ctx, W, H) {
    if (this.state !== 'racing') return;

    const car  = this.playerCar;
    const opp  = this.opponentCar;
    const rY   = Race.ROAD_Y;

    // ── RPM Gauge ──────────────────────────────────────────
    const gX = W - 200, gY = H - 130;
    const gW = 180, gH = 100;

    ctx.fillStyle = 'rgba(5,4,15,0.85)';
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    this._roundRect(ctx, gX, gY, gW, gH, 6);
    ctx.fill(); ctx.stroke();

    // Gear
    ctx.fillStyle = car.shifting ? '#ff9900' : '#ffcc00';
    ctx.font = 'bold 44px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(car.shifting ? '↑' : (car.gear || 'N'), gX + 32, gY + 58);

    // RPM bar
    const barX = gX + 60, barY = gY + 12, barW = gW - 72, barH = 22;
    const zone  = car.shiftZone();
    const rFrac = car.rpmFraction();
    const segs  = 18;
    const sW    = barW / segs;

    for (let i = 0; i < segs; i++) {
      const f = (i + 0.5) / segs;
      let col;
      if      (f >= zone.optimalLow && f <= zone.optimalHigh) col = '#00ff55';
      else if (f >= zone.earlyLow   && f < zone.optimalLow)   col = '#ffcc00';
      else if (f > zone.optimalHigh)                           col = '#ff2200';
      else                                                     col = '#223';

      ctx.fillStyle = f <= rFrac ? col : col + '55';
      ctx.fillRect(barX + i * sW, barY, sW - 1, barH);
    }

    // Shift indicator
    if (rFrac >= zone.optimalLow) {
      ctx.fillStyle = '#00ff55';
      ctx.font = 'bold 10px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('SHIFT!', barX + barW / 2, barY - 2);
    }

    // RPM number
    ctx.fillStyle = '#aaa';
    ctx.font = '11px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(car.rpm).toLocaleString()} RPM`, barX, gY + 50);

    // Speed
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 26px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(car.speed)} mph`, gX + gW - 5, gY + 92);

    // ── Distance bar ────────────────────────────────────────
    const dBarX = 20, dBarY = H - 60, dBarW = W - 240, dBarH = 12;
    const dPct  = Math.min(1, car.distance / 1320);
    const oPct  = Math.min(1, opp.distance / 1320);

    ctx.fillStyle = '#111122';
    ctx.fillRect(dBarX, dBarY, dBarW, dBarH);
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(dBarX, dBarY, dBarW * dPct, dBarH);
    ctx.fillStyle = '#ff6644';
    ctx.fillRect(dBarX + dBarW * oPct - 2, dBarY - 3, 4, dBarH + 6);

    ctx.fillStyle = '#ffffff66';
    ctx.font = '11px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(car.distance)} / 1320 ft`, dBarX, dBarY - 4);

    // ── Gap indicator ────────────────────────────────────────
    const gap = car.distance - opp.distance;
    ctx.fillStyle = gap >= 0 ? '#00ff88' : '#ff4444';
    ctx.font = 'bold 14px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(
      gap >= 0 ? `▲ ${Math.round(gap)}ft ahead` : `▼ ${Math.round(-gap)}ft behind`,
      20, H - 78
    );

    // ── NOS indicators ───────────────────────────────────────
    if (car.nosUses > 0) {
      for (let i = 0; i < car.nosUses; i++) {
        const nx = 20 + i * 38;
        const ny = H - 110;
        const active = i < car.nosUsesLeft;
        ctx.fillStyle = active ? (car.nosActive ? '#00ffff' : '#006688') : '#1a1a2a';
        ctx.fillRect(nx, ny, 32, 20);
        ctx.strokeStyle = active ? '#00ccff' : '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(nx, ny, 32, 20);
        if (active) {
          ctx.fillStyle = '#fff';
          ctx.font = '9px "Courier New"';
          ctx.textAlign = 'center';
          ctx.fillText('NOS', nx + 16, ny + 13);
        }
      }
    }

    // ── Wheel slip warning ────────────────────────────────────
    if (car.wheelSlip) {
      ctx.fillStyle = `rgba(255,150,0,${0.6 + Math.sin(Date.now() * 0.02) * 0.4})`;
      ctx.font = 'bold 18px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ WHEELSPIN', W / 2, rY - 20);
    }

    // ── Perfect launch flash ──────────────────────────────────
    if (this.perfectLaunch && car.elapsed < 1.2) {
      ctx.fillStyle = `rgba(0,255,100,${0.8 - car.elapsed * 0.6})`;
      ctx.font = 'bold 28px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('PERFECT LAUNCH!', W / 2, rY + 60);
    }
  }

  _drawTree(ctx, W, H) {
    const tx = W / 2;
    const ty = 10;
    const pw = 110, ph = 210;

    // Panel
    ctx.fillStyle = 'rgba(3,3,12,0.9)';
    this._roundRect(ctx, tx - pw / 2, ty, pw, ph, 6);
    ctx.fill();
    ctx.strokeStyle = '#222240';
    ctx.lineWidth = 1;
    this._roundRect(ctx, tx - pw / 2, ty, pw, ph, 6);
    ctx.stroke();

    const light = (cx, cy, r, col, on) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = on ? col : '#111122';
      if (on) {
        ctx.shadowBlur  = 20;
        ctx.shadowColor = col;
      }
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    };

    const S = this.treeState;
    const preOn   = ['pre','stage','a1','a2','a3','go'].includes(S);
    const stageOn = ['stage','a1','a2','a3','go'].includes(S);
    const a1On    = ['a1','a2','a3','go'].includes(S);
    const a2On    = ['a2','a3','go'].includes(S);
    const a3On    = ['a3','go'].includes(S);
    const goOn    = S === 'go';
    const redOn   = S === 'red';

    const AMBER = '#ff9900', GREEN = '#00ff44', RED = '#ff0000';

    // Pre-stage & Stage (small)
    light(tx - 18, ty + 22, 7, AMBER, preOn);
    light(tx + 18, ty + 22, 7, AMBER, preOn);
    light(tx - 18, ty + 44, 7, AMBER, stageOn);
    light(tx + 18, ty + 44, 7, AMBER, stageOn);

    // Ambers (larger)
    light(tx - 18, ty + 76,  11, AMBER, a1On);
    light(tx + 18, ty + 76,  11, AMBER, a1On);
    light(tx - 18, ty + 110, 11, AMBER, a2On);
    light(tx + 18, ty + 110, 11, AMBER, a2On);
    light(tx - 18, ty + 144, 11, AMBER, a3On);
    light(tx + 18, ty + 144, 11, AMBER, a3On);

    // Green / Red
    light(tx - 18, ty + 180, 12, redOn ? RED : GREEN, goOn || redOn);
    light(tx + 18, ty + 180, 12, redOn ? RED : GREEN, goOn || redOn);

    // Red label
    if (redOn) {
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 14px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('FALSE START', tx, ty + ph + 22);
    }

    // Staging hint
    if (S === 'off' || this.state === 'staging') {
      ctx.fillStyle = '#ffffff55';
      ctx.font = '12px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('Hold SPACE to rev', W / 2, H - 36);
      ctx.fillText('Launch on GREEN light', W / 2, H - 18);

      // Launch RPM bar
      const lbX = W / 2 - 100, lbY = H - 60;
      const pct = this.launchRPM / this.playerCar.redline;
      const optLow = 0.55, optHigh = 0.72;
      ctx.fillStyle = '#111122';
      ctx.fillRect(lbX, lbY, 200, 10);
      ctx.fillStyle = pct < optLow ? '#ffcc00' : (pct < optHigh ? '#00ff55' : '#ff4400');
      ctx.fillRect(lbX, lbY, 200 * pct, 10);
      // Optimal zone marker
      ctx.fillStyle = '#00ff5566';
      ctx.fillRect(lbX + 200 * optLow, lbY, 200 * (optHigh - optLow), 10);
      ctx.fillStyle = '#ffffff44';
      ctx.font = '10px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('LAUNCH RPM', W / 2, lbY - 2);
    }
  }

  _drawResults(ctx, W, H) {
    if (!this.results) return;
    const r = this.results;

    ctx.fillStyle = 'rgba(2,2,10,0.88)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';

    if (r.disqualified) {
      ctx.fillStyle = '#ff2200';
      ctx.font = 'bold 52px "Courier New"';
      ctx.fillText('DISQUALIFIED', W / 2, H / 2 - 90);
      ctx.fillStyle = '#ff6644';
      ctx.font = '20px "Courier New"';
      ctx.fillText('False start penalty', W / 2, H / 2 - 45);
    } else if (r.won) {
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 52px "Courier New"';
      ctx.shadowBlur  = 30;
      ctx.shadowColor = '#00ff88';
      ctx.fillText('VICTORY!', W / 2, H / 2 - 90);
      ctx.shadowBlur  = 0;
    } else {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 52px "Courier New"';
      ctx.fillText('DEFEAT', W / 2, H / 2 - 90);
    }

    ctx.fillStyle = '#ccccdd';
    ctx.font = '20px "Courier New"';
    const pT = r.playerTime  < 999 ? r.playerTime.toFixed(3)  + 's' : 'DNF';
    const oT = r.opponentTime < 999 ? r.opponentTime.toFixed(3) + 's' : 'DNF';
    ctx.fillText(`YOUR TIME  :  ${pT}`, W / 2, H / 2 - 20);
    ctx.fillText(`OPPONENT   :  ${oT}`, W / 2, H / 2 + 18);

    if (!r.disqualified) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = '20px "Courier New"';
      ctx.fillText(`TRAP SPEED :  ${Math.round(r.playerSpeed)} mph`, W / 2, H / 2 + 58);
    }

    ctx.fillStyle = r.won ? '#00ffcc' : '#888';
    ctx.font = 'bold 24px "Courier New"';
    ctx.fillText(r.won ? `+ $${r.reward.toLocaleString()}` : '+ $0', W / 2, H / 2 + 100);

    ctx.fillStyle = '#ffffff44';
    ctx.font = '15px "Courier New"';
    ctx.fillText('Press ENTER or tap to continue', W / 2, H / 2 + 148);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
