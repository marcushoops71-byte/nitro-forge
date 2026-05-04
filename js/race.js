// ===== NITRO FORGE - RACE.JS =====

const Race = (() => {
  // ── STATE ──
  let state = 'idle'; // idle | staging | staged | countdown | racing | finished
  let playerCar, opponentCar, opponentData;
  let raceCanvas, rCtx;
  let animId = null;

  // Physics
  let pSpeed = 0, oSpeed = 0;
  let pDist = 0, oDist = 0;
  let pRpm = 0, oRpm = 0;
  let pGear = 0, oGear = 0;
  let pNosActive = false, pNosTime = 0;
  let pLaunchHeld = false;
  let pReactionStart = 0, pReactionTime = 0;
  let raceTime = 0, raceStartTime = 0;
  let lastFrame = 0;
  let raceFinished = false;
  let lastShiftRpm = 0;

  // AI
  let oLaunchDelay = 0, oShiftPoints = [];
  let oNosUsed = false, oNosTimer = 0;

  // Tree
  let treeStage = -1;
  let treeTimer = 0;
  let greenLit = false;

  // Track
  const TRACK_LENGTH_FT = 1320; // quarter mile = 1320 ft
  const MPH_TO_FPS = 1.46667;
  const FPS_TO_MPH = 1 / MPH_TO_FPS;

  // Canvas
  let bgOffset = 0;
  const CAR_SCALE = 1.6;

  function init(canvas) {
    raceCanvas = canvas;
    rCtx = canvas.getContext('2d');
    resizeCanvas();
  }

  function resizeCanvas() {
    raceCanvas.width = raceCanvas.offsetWidth || 480;
    raceCanvas.height = raceCanvas.offsetHeight || 340;
  }

  function setup(pCar, oCar, oData) {
    playerCar = pCar;
    opponentCar = oCar;
    opponentData = oData;

    pSpeed = 0; oSpeed = 0; pDist = 0; oDist = 0;
    pRpm = 0;   oRpm = 800; pGear = 0; oGear = 1;
    pNosActive = false; pNosTime = 0; pNosTimer = 0;
    pLaunchHeld = false;
    pReactionStart = 0; pReactionTime = 0;
    raceTime = 0; raceStartTime = 0;
    raceFinished = false; lastShiftRpm = 0;
    greenLit = false; treeStage = -1;
    bgOffset = 0;

    // AI shift points: shift at 88-96% redline depending on skill
    const skill = opponentData.skill;
    oLaunchDelay = 0.3 + (1 - skill) * 0.5 + Math.random() * 0.2;
    oShiftPoints = [];
    oNosUsed = false; oNosTimer = 0;

    state = 'staging';
    updateActionBtn();
    updateTreeLights(-1);
    document.getElementById('race-status-text').textContent = 'STAGE';
    document.getElementById('btn-nos').disabled = !playerCar.hasNos;
  }

  function mainAction() {
    Audio.resume();
    if (state === 'staging') {
      state = 'staged';
      pReactionStart = performance.now();
      startTree();
      document.getElementById('race-status-text').textContent = 'READY';
      updateActionBtn();
    } else if (state === 'racing' && pGear < playerCar.gears) {
      doShift();
    }
  }

  function startTree() {
    treeStage = 0;
    const intervals = [600, 600, 600, 600, 600]; // yellow1, yellow2, yellow3, yellow4, green
    let delay = 0;
    intervals.forEach((ms, i) => {
      delay += ms;
      setTimeout(() => {
        if (state === 'finished' || state === 'idle') return;
        treeStage = i;
        updateTreeLights(i);
        if (i === 4) {
          greenLit = true;
          go();
        }
      }, delay);
    });
  }

  function updateTreeLights(stage) {
    const ids = ['tl-s1','tl-s2','tl-a1','tl-a2','tl-a3','tl-a4','tl-g1','tl-g2'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.remove('on'); }
    });
    if (stage >= 0) { document.getElementById('tl-s1')?.classList.add('on'); document.getElementById('tl-s2')?.classList.add('on'); }
    if (stage >= 1) { document.getElementById('tl-a1')?.classList.add('on'); document.getElementById('tl-a2')?.classList.add('on'); }
    if (stage >= 2) { document.getElementById('tl-a3')?.classList.add('on'); document.getElementById('tl-a4')?.classList.add('on'); }
    if (stage >= 4) { document.getElementById('tl-g1')?.classList.add('on'); document.getElementById('tl-g2')?.classList.add('on'); }
  }

  function go() {
    if (state === 'finished') return;
    state = 'racing';
    pReactionTime = (performance.now() - pReactionStart) / 1000;
    raceStartTime = performance.now();
    pGear = 1;
    pRpm = playerCar.launchRpm;
    pSpeed = 2;
    Audio.playLaunch();
    document.getElementById('race-status-text').textContent = 'GO!';
    updateActionBtn();
    setTimeout(() => {
      if (state === 'racing') document.getElementById('race-status-text').textContent = 'RACING';
    }, 600);
  }

  function doShift() {
    if (pGear >= playerCar.gears) return;
    const rpmPct = pRpm / playerCar.redline;
    let quality = 'late';
    let bonusMult = 1.0;

    if (rpmPct >= 0.96 && rpmPct <= 1.0) {
      quality = 'perfect';
      bonusMult = 1.0 + 0.04 + playerCar.shiftBonus;
      showShiftMsg('PERFECT!', 'perfect');
      triggerPerfectFlash();
      Audio.playPerfectShift();
      Game.addCombo();
    } else if (rpmPct >= 0.88) {
      quality = 'good';
      bonusMult = 1.0 + 0.015 + playerCar.shiftBonus;
      showShiftMsg('GOOD', 'good');
      Audio.playShift();
    } else if (rpmPct >= 0.72) {
      quality = 'early';
      bonusMult = 1.0 - 0.02;
      showShiftMsg('EARLY', 'early');
      Audio.playShift();
    } else {
      bonusMult = 1.0 - 0.06;
      showShiftMsg('LATE', 'late');
      Audio.playShift();
    }

    pGear++;
    pRpm = playerCar.redline * 0.52 * bonusMult;
    pSpeed *= (0.95 + playerCar.shiftBonus * 0.3);
    lastShiftRpm = pRpm;
    updateActionBtn();
  }

  function showShiftMsg(text, cls) {
    const el = document.getElementById('shift-msg');
    el.textContent = text;
    el.className = 'shift-msg show ' + cls;
    setTimeout(() => el.className = 'shift-msg', 900);
  }

  function triggerPerfectFlash() {
    const el = document.getElementById('race-perfect-flash');
    el.classList.remove('hidden', 'show');
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 300);
  }

  function activateNos() {
    if (!playerCar.hasNos || pNosActive || pNosTime >= playerCar.nosDuration || state !== 'racing') return;
    pNosActive = true;
    Audio.startNos();
    UI.toast('⚡ NOS ACTIVATED!', 'info');
  }

  // ── PHYSICS UPDATE ──
  function physicsStep(dt) {
    if (state !== 'racing' || raceFinished) return;
    raceTime = (performance.now() - raceStartTime) / 1000;

    // ── PLAYER PHYSICS ──
    const pMaxSpd = playerCar.maxSpeedByGear[pGear - 1] || 0;
    let pHpEff = playerCar.hp;

    // NOS
    if (pNosActive) {
      pNosTime += dt;
      pHpEff += playerCar.nosHp;
      Audio.startNos();
      if (pNosTime >= playerCar.nosDuration) {
        pNosActive = false;
        Audio.stopNos();
      }
    }

    // Acceleration formula: F = hp * 2.5 / weight, limited by gear top speed
    const pAccel = Math.max(0, (pHpEff * 2.5 / playerCar.weight) * (1 - pSpeed / pMaxSpd) * playerCar.grip * 2.0);
    pSpeed = Math.min(pMaxSpd, pSpeed + pAccel * dt * 60);

    // Auto-shift hint at redline
    const targetRpm = playerCar.redline * (pSpeed / pMaxSpd);
    pRpm = Math.max(pRpm * 0.85 + targetRpm * 0.15, 1200);
    if (pRpm >= playerCar.redline * 0.99 && pGear < playerCar.gears) {
      Audio.playRedline();
    }

    pDist += pSpeed * MPH_TO_FPS * dt;

    // Audio rpm
    Audio.setRpm(pRpm);
    updateNosBar();

    // ── AI PHYSICS ──
    const oCar = opponentCar;
    oLaunchDelay -= dt;
    if (oLaunchDelay <= 0 && oGear === 1 && oSpeed < 5) {
      oSpeed = 3 + opponentData.skill * 5;
    }

    // AI gear shift
    const oMaxSpd = oCar.maxSpeedByGear[oGear - 1] || 190;
    if (oGear < oCar.gears) {
      const oRpmPct = oSpeed / oMaxSpd;
      const shiftAt = 0.85 + opponentData.skill * 0.12 + (Math.random() - 0.5) * 0.04;
      if (oRpmPct >= shiftAt) {
        oGear++;
        oSpeed *= 0.96;
      }
    }

    // AI NOS
    if (!oNosUsed && oCar.hasNos && oDist > 200 && opponentData.skill > 0.6) {
      oNosUsed = true; oNosTimer = oCar.nosDuration;
    }
    let oHpEff = oCar.hp;
    if (oNosTimer > 0) { oHpEff += oCar.nosHp; oNosTimer -= dt; }

    const oAccel = Math.max(0, (oHpEff * 2.5 / oCar.weight) * (1 - oSpeed / oMaxSpd) * oCar.grip * 2.0);
    // Skill affects accuracy
    const skillMod = opponentData.skill + (Math.random() - 0.5) * 0.08;
    oSpeed = Math.min(oMaxSpd, oSpeed + oAccel * dt * 60 * skillMod);
    oDist += oSpeed * MPH_TO_FPS * dt;

    // ── FINISH CHECK ──
    const pFinished = pDist >= TRACK_LENGTH_FT;
    const oFinished = oDist >= TRACK_LENGTH_FT;
    if (pFinished || oFinished) {
      raceFinished = true;
      finishRace(pFinished, oFinished);
    }

    // Update HUD
    updateRaceHud();
  }

  function updateNosBar() {
    const pct = playerCar.hasNos ? Math.max(0, 1 - pNosTime / playerCar.nosDuration) * 100 : 0;
    document.getElementById('nos-bar-fill').style.height = pct + '%';
    document.getElementById('btn-nos').disabled = !playerCar.hasNos || pNosActive || pNosTime >= playerCar.nosDuration || state !== 'racing';
  }

  function updateRaceHud() {
    document.getElementById('r-time').textContent = raceTime.toFixed(3);
    document.getElementById('r-dist').textContent = Math.round(pDist) + ' ft';
    document.getElementById('r-speed').textContent = Math.round(pSpeed);
    document.getElementById('r-gear').textContent = pGear === 0 ? 'N' : pGear;
    drawRpmGauge();
  }

  function drawRpmGauge() {
    const canvas = document.getElementById('rpm-gauge');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0c0c1a';
    ctx.fillRect(0, 0, w, h);

    const segments = playerCar.gears;
    const segW = w / (playerCar.redline / 1000);
    const rpmK = playerCar.redline / 1000;

    // Colored zones
    for (let k = 0; k <= rpmK; k++) {
      const x = (k / rpmK) * w;
      const isRed = k >= rpmK * 0.88;
      const isYellow = k >= rpmK * 0.72 && !isRed;
      ctx.fillStyle = isRed ? '#330008' : isYellow ? '#2a2200' : '#0a0a18';
      ctx.fillRect(x, 0, w / rpmK, h - 12);
    }

    // Fill
    const fillPct = Math.min(1, pRpm / playerCar.redline);
    const fillColor = fillPct > 0.88 ? '#ff1144' : fillPct > 0.72 ? '#ffcc00' : '#39ff14';
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, fillPct * w, h - 12);

    // Glow
    if (fillPct > 0.72) {
      ctx.shadowColor = fillColor;
      ctx.shadowBlur = 6;
      ctx.fillRect(fillPct * w - 3, 0, 3, h - 12);
      ctx.shadowBlur = 0;
    }

    // RPM ticks
    ctx.fillStyle = '#444466';
    for (let k = 0; k <= rpmK; k++) {
      const x = (k / rpmK) * w;
      ctx.fillRect(x, h - 12, 1, 12);
    }
    // Labels
    ctx.fillStyle = '#778';
    ctx.font = '7px Share Tech Mono';
    for (let k = 0; k <= rpmK; k += 2) {
      const x = (k / rpmK) * w;
      ctx.fillText(k, x + 1, h - 1);
    }
  }

  function updateActionBtn() {
    const btn = document.getElementById('btn-race-main');
    if (!btn) return;
    if (state === 'staging') {
      btn.textContent = '▶ STAGE';
      btn.className = 'btn btn-launch';
    } else if (state === 'staged' || state === 'countdown') {
      btn.textContent = '⚡ ARMED';
      btn.className = 'btn btn-launch armed';
    } else if (state === 'racing') {
      if (pGear >= playerCar.gears) {
        btn.textContent = '🔴 REDLINE';
        btn.className = 'btn btn-launch';
      } else {
        btn.textContent = '🔼 SHIFT — ' + (pGear + 1);
        btn.className = 'btn btn-launch shift-mode';
      }
    }
  }

  // ── TRACK RENDERING ──
  function drawTrack() {
    const c = rCtx;
    const W = raceCanvas.width, H = raceCanvas.height;
    const trackH = H * 0.62;

    // Sky gradient
    const skyGrad = c.createLinearGradient(0, 0, 0, trackH);
    skyGrad.addColorStop(0, '#05050d');
    skyGrad.addColorStop(1, '#0d0d22');
    c.fillStyle = skyGrad;
    c.fillRect(0, 0, W, trackH);

    // Stars
    c.fillStyle = 'rgba(255,255,255,0.6)';
    const stars = [[22,8],[80,15],[130,5],[190,18],[250,9],[310,14],[370,6],[420,11],[60,22],[170,25],[280,20],[400,18]];
    stars.forEach(([sx,sy]) => c.fillRect(sx, sy, 1, 1));

    // Horizon glow
    const hGrad = c.createLinearGradient(0, trackH - 20, 0, trackH);
    hGrad.addColorStop(0, 'transparent');
    hGrad.addColorStop(1, 'rgba(57,255,20,0.08)');
    c.fillStyle = hGrad;
    c.fillRect(0, 0, W, trackH);

    // Road
    const roadGrad = c.createLinearGradient(0, trackH, 0, H);
    roadGrad.addColorStop(0, '#1a1a2a');
    roadGrad.addColorStop(1, '#0d0d18');
    c.fillStyle = roadGrad;
    c.fillRect(0, trackH, W, H - trackH);

    // Road edge lines
    c.strokeStyle = '#ffcc00';
    c.lineWidth = 2;
    c.setLineDash([]);
    c.beginPath(); c.moveTo(0, trackH); c.lineTo(W, trackH); c.stroke();
    c.beginPath(); c.moveTo(0, H - 8); c.lineTo(W, H - 8); c.stroke();

    // Center dashes - moving based on speed
    if (state === 'racing') bgOffset = (bgOffset + pSpeed * 0.15) % 80;
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2;
    c.setLineDash([30, 50]);
    c.lineDashOffset = -bgOffset;
    c.beginPath();
    const laneY = trackH + (H - trackH) / 2;
    c.moveTo(0, laneY); c.lineTo(W, laneY);
    c.stroke();
    c.setLineDash([]);

    // Track markings
    c.fillStyle = '#333344';
    c.fillRect(0, trackH + 4, W, 2);

    // Finish line indicator
    const pPct = Math.min(1, pDist / TRACK_LENGTH_FT);
    const finishX = W * 0.9;
    c.strokeStyle = 'rgba(255,255,255,0.15)';
    c.lineWidth = 3;
    c.setLineDash([6, 6]);
    c.beginPath(); c.moveTo(finishX, trackH); c.lineTo(finishX, H - 8); c.stroke();
    c.setLineDash([]);
  }

  function drawCars() {
    const c = rCtx;
    const W = raceCanvas.width, H = raceCanvas.height;
    const trackH = H * 0.62;
    const laneH = H - trackH;

    // Calculate relative positions
    const range = TRACK_LENGTH_FT;
    const pPct = Math.min(1, pDist / range);
    const oPct = Math.min(1, oDist / range);

    // Player car: anchored at ~30% of screen, track scrolls
    const pCarX = W * 0.22;
    const pCarY = trackH + laneH * 0.1;

    // Opponent car: positioned relative to player
    const diffFt = oDist - pDist;
    const diffPx = diffFt * 0.85; // pixels per foot scale
    const oCarX = pCarX + diffPx;
    const oCarY = trackH - laneH * 0.05;

    // Draw opponent
    if (oCarX > -120 && oCarX < W + 60) {
      c.globalAlpha = 0.9;
      opponentCar.draw(c, oCarX, oCarY, CAR_SCALE, false);
      c.globalAlpha = 1;
      // Opponent label
      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.fillRect(oCarX, oCarY - 14, 80, 12);
      c.fillStyle = '#778';
      c.font = '8px Share Tech Mono';
      c.fillText(opponentData.name.substring(0,12), oCarX + 2, oCarY - 4);
    }

    // Draw player car
    playerCar.draw(c, pCarX, pCarY, CAR_SCALE, false);

    // NOS flame effect
    if (pNosActive) {
      drawFlame(c, pCarX - 8, pCarY + 20 * CAR_SCALE, CAR_SCALE);
    }

    // Speed lines
    if (pSpeed > 80) {
      drawSpeedLines(c, W, trackH, H, pSpeed);
    }

    // Mini-map progress
    drawProgressBar(c, W, H, pPct, oPct);
  }

  function drawFlame(c, x, y, s) {
    const cols = ['#ff4400','#ff8800','#ffcc00','#ffffff'];
    for (let i = 0; i < 4; i++) {
      c.fillStyle = cols[i];
      const fw = (4 - i) * s * 2;
      const fh = (8 + i * 4 + Math.random() * 6) * s;
      c.fillRect(x - fw / 2 - i * s * 3, y - fh / 2, fw, fh);
    }
  }

  function drawSpeedLines(c, W, trackH, H, speed) {
    const alpha = Math.min(0.25, (speed - 80) / 200);
    c.strokeStyle = `rgba(200,200,255,${alpha})`;
    c.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const y = trackH + Math.random() * (H - trackH);
      const len = 30 + Math.random() * 60;
      c.beginPath();
      c.moveTo(Math.random() * W * 0.4, y);
      c.lineTo(Math.random() * W * 0.4 + len, y);
      c.stroke();
    }
  }

  function drawProgressBar(c, W, H, pPct, oPct) {
    const barW = W - 20, barH = 6, barX = 10, barY = H - 6;
    c.fillStyle = '#1a1a2a';
    c.fillRect(barX, barY, barW, barH);
    // Track line
    c.fillStyle = '#2a2a4a';
    c.fillRect(barX, barY + 2, barW, 2);
    // Player dot
    c.fillStyle = '#39ff14';
    c.fillRect(barX + pPct * barW - 3, barY, 6, barH);
    // Opponent dot
    c.fillStyle = '#ff4400';
    c.fillRect(barX + oPct * barW - 2, barY + 1, 4, barH - 2);
  }

  function drawIdle() {
    const c = rCtx;
    const W = raceCanvas.width, H = raceCanvas.height;
    c.clearRect(0, 0, W, H);
    drawTrack();

    const trackH = H * 0.62;
    const laneH = H - trackH;

    // Both cars staged
    playerCar.draw(c, W * 0.1, trackH + laneH * 0.1, CAR_SCALE);
    if (opponentCar) opponentCar.draw(c, W * 0.1, trackH - laneH * 0.05, CAR_SCALE);

    // Staging glow
    c.fillStyle = 'rgba(57,255,20,0.06)';
    c.fillRect(0, trackH - 10, W, laneH + 10);

    // Beam
    c.strokeStyle = 'rgba(255,200,0,0.3)';
    c.lineWidth = 1;
    c.setLineDash([2, 4]);
    c.beginPath(); c.moveTo(W * 0.4, trackH); c.lineTo(W * 0.4, H - 8); c.stroke();
    c.setLineDash([]);
  }

  // ── MAIN LOOP ──
  function loop(ts) {
    animId = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;

    const c = rCtx;
    const W = raceCanvas.width, H = raceCanvas.height;
    c.clearRect(0, 0, W, H);

    if (state === 'staging' || state === 'staged') {
      drawIdle();
    } else if (state === 'racing' || state === 'finished') {
      physicsStep(dt);
      drawTrack();
      drawCars();
    } else {
      drawTrack();
    }
  }

  function start() {
    if (animId) cancelAnimationFrame(animId);
    lastFrame = performance.now();
    animId = requestAnimationFrame(loop);
  }

  function stop() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    Audio.idle();
    Audio.stopNos();
  }

  function finishRace(pWon, oWon) {
    state = 'finished';
    Audio.stopNos();
    Audio.idle();

    let topSpeed = Math.round(Math.max(pSpeed, 0));
    let et = raceTime.toFixed(3);
    let result = pWon && !oWon ? 'win' : !pWon && oWon ? 'lose' : 'draw';
    let reactionStr = pReactionTime.toFixed(3);

    // Record keeping
    Game.recordRace({
      carId: playerCar.carId,
      et: parseFloat(et),
      topSpeed,
      result,
      reaction: parseFloat(reactionStr),
    });

    // Rewards
    let cashEarned = 0, xpEarned = 0;
    if (result === 'win') {
      cashEarned = opponentData.reward;
      xpEarned = opponentData.xp;
    } else if (result === 'draw') {
      cashEarned = Math.round(opponentData.reward * 0.3);
      xpEarned = Math.round(opponentData.xp * 0.4);
    } else {
      cashEarned = Math.round(opponentData.reward * 0.08);
      xpEarned = Math.round(opponentData.xp * 0.2);
    }

    Game.addCash(cashEarned);
    Game.addXP(xpEarned);

    setTimeout(() => {
      stop();
      showResults(result, et, topSpeed, reactionStr, cashEarned, xpEarned);
    }, 800);
  }

  function showResults(result, et, topSpeed, reaction, cash, xp) {
    const banner = document.getElementById('results-banner');
    banner.textContent = result === 'win' ? 'VICTORY!' : result === 'lose' ? 'DEFEAT' : 'DRAW';
    banner.className = result;

    const oET = (raceTime + (opponentData.skill > 0.7 ? -0.1 : 0.15) * (1 - opponentData.skill)).toFixed(3);
    document.getElementById('results-winner-text').textContent =
      result === 'win' ? `You beat ${opponentData.name}!` :
      result === 'lose' ? `${opponentData.name} wins this round.` :
      'Too close to call!';

    document.getElementById('results-stats-grid').innerHTML = `
      <div class="res-stat"><div class="res-stat-label">YOUR ET</div><div class="res-stat-value good">${et}s</div></div>
      <div class="res-stat"><div class="res-stat-label">OPP ET</div><div class="res-stat-value">${oET}s</div></div>
      <div class="res-stat"><div class="res-stat-label">TOP SPEED</div><div class="res-stat-value highlight">${topSpeed} mph</div></div>
      <div class="res-stat"><div class="res-stat-label">REACTION</div><div class="res-stat-value">${reaction}s</div></div>
    `;

    document.getElementById('results-rewards-box').innerHTML = `
      <div class="reward-line">💰 +$${cash.toLocaleString()}</div>
      <div class="reward-line">⭐ +${xp} XP</div>
    `;

    UI.show('results');
  }

  function restart() {
    if (!opponentData) return;
    playerCar._computeStats();
    setup(playerCar, opponentCar, opponentData);
    UI.show('race');
    start();
  }

  function getCurrentOpponent() { return opponentData; }
  function getState() { return state; }

  return {
    init, setup, start, stop,
    mainAction, activateNos, restart,
    getCurrentOpponent, getState,
  };
})();
