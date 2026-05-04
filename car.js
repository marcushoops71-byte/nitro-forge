// ===== NITRO FORGE - CAR.JS =====

class Car {
  constructor(carId, config) {
    this.carId = carId;
    this.data = CARS_DATA[carId];
    this.config = config || defaultCarConfig(carId);
    this._computeStats();
  }

  _computeStats() {
    const d = this.data, m = this.config.mods;
    let hp = d.baseHp;
    hp += MODS.engine[m.engine].hp;
    hp += MODS.forced[m.forced].hp;
    hp += MODS.exhaust[m.exhaust].hp;
    hp += MODS.intake[m.intake].hp;
    hp *= (1 + MODS.ecu[m.ecu].boost);

    const weight = d.baseWeight - MODS.weight[m.weight].reduction;
    const grip = d.baseGrip * MODS.tires[m.tires].grip / 0.70;
    const clampedGrip = Math.min(1.0, Math.max(0.5, grip));
    const shiftBonus = MODS.transmission[m.transmission].shiftBonus;
    const launchBonus = MODS.suspension[m.suspension].launch;

    const nos = MODS.nitrous[m.nitrous];
    this.nosHp = nos.hp;
    this.nosDuration = nos.dur;
    this.hasNos = nos.hp > 0;

    this.hp = Math.round(hp);
    this.weight = weight;
    this.grip = clampedGrip;
    this.shiftBonus = shiftBonus;
    this.launchBonus = launchBonus;
    this.gears = d.gears;
    this.redline = d.redline;
    this.color = this.config.color;

    // Scale max speeds by power ratio
    const powerRatio = hp / d.baseHp;
    const speedScale = Math.pow(powerRatio, 0.32);
    this.maxSpeedByGear = d.maxSpeedByGear.map(s => Math.round(s * speedScale));

    // Performance rating
    this.rating = Math.min(999, Math.round(
      this.hp * 0.45 + (this.hp / this.weight * 1000) * 14 + clampedGrip * 80
    ));

    // Launch RPM
    const launchPct = (this.config.tune?.launchRpm ?? 0.55) + launchBonus;
    this.launchRpm = Math.round(this.redline * Math.min(0.85, launchPct));
  }

  getStatPercents() {
    return {
      hp: Math.min(100, this.hp / 12),
      wt: Math.max(0, 100 - (this.weight - 2000) / 30),
      gr: this.grip * 100,
      pr: Math.min(100, this.rating / 10),
    };
  }

  draw(ctx, x, y, scale = 1, flip = false) {
    CarRenderer.draw(ctx, x, y, this.data.drawType, this.color, scale, flip);
  }
}

// ─── CAR RENDERER ───
const CarRenderer = {
  draw(ctx, x, y, type, color, scale = 1, flip = false) {
    ctx.save();
    if (flip) {
      ctx.translate(x + 80 * scale, y);
      ctx.scale(-1, 1);
      ctx.translate(-x, -y);
    }
    const fn = CarRenderer['_' + type] || CarRenderer['_hatchback'];
    fn(ctx, x, y, color, scale);
    ctx.restore();
  },

  _px(ctx, x, y, w, h, color, scale) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x * scale), Math.round(y * scale), Math.round(w * scale), Math.round(h * scale));
  },

  _wheel(ctx, cx, cy, r, scale) {
    const s = scale;
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx * s, cy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#555566';
    ctx.beginPath();
    ctx.arc(cx * s, cy * s, (r - 2) * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#888899';
    ctx.beginPath();
    ctx.arc(cx * s, cy * s, (r - 4) * s, 0, Math.PI * 2);
    ctx.fill();
  },

  _hatchback(ctx, bx, by, color, s) {
    const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round((bx+x)*s),Math.round((by+y)*s),Math.round(w*s),Math.round(h*s)); };
    // shadow
    p(4,33,72,4,'rgba(0,0,0,0.3)');
    // body
    p(0,16,78,16,color); p(2,18,74,12,color);
    // cabin
    p(10,7,48,11,color); p(8,10,52,8,color);
    // windshields
    p(12,8,18,9,'#1a3a5a'); p(32,8,20,9,'#1a3a5a');
    // pillars
    p(10,7,3,12,color); p(30,7,3,12,color); p(52,7,3,12,color);
    // headlights
    p(70,18,8,5,'#ffffaa'); p(72,19,4,3,'#ffffff');
    // taillights
    p(0,18,6,5,'#ff2222'); p(1,19,3,3,'#ff4444');
    // bumpers
    p(68,24,10,4,'#888899'); p(0,24,8,4,'#888899');
    // door line
    p(10,21,58,1,'rgba(0,0,0,0.25)');
    // wheels
    CarRenderer._wheel(ctx, bx+16, by+33, 9, s);
    CarRenderer._wheel(ctx, bx+62, by+33, 9, s);
    // exhaust
    p(0,26,4,3,'#666677');
  },

  _hatchback2(ctx, bx, by, color, s) {
    const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round((bx+x)*s),Math.round((by+y)*s),Math.round(w*s),Math.round(h*s)); };
    p(4,33,72,4,'rgba(0,0,0,0.3)');
    p(0,17,80,15,color);
    p(8,8,52,11,color); p(6,11,56,8,color);
    p(10,9,22,9,'#1a3a5a'); p(34,9,22,9,'#1a3a5a');
    p(8,8,3,12,color); p(32,8,3,12,color); p(56,8,3,12,color);
    p(72,18,6,5,'#ffffaa');
    p(0,18,5,5,'#ff2222');
    p(70,24,10,4,'#888899'); p(0,24,8,4,'#888899');
    p(10,22,58,1,'rgba(0,0,0,0.2)');
    CarRenderer._wheel(ctx, bx+15, by+33, 9, s);
    CarRenderer._wheel(ctx, bx+64, by+33, 9, s);
    p(0,27,4,3,'#666677');
  },

  _coupe(ctx, bx, by, color, s) {
    const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round((bx+x)*s),Math.round((by+y)*s),Math.round(w*s),Math.round(h*s)); };
    p(4,34,76,4,'rgba(0,0,0,0.3)');
    p(2,15,80,17,color); p(0,19,82,13,color);
    // Sleek roofline
    p(14,7,44,10,color); p(12,10,48,8,color);
    p(16,8,20,8,'#1a3a5a'); p(38,8,18,8,'#1a3a5a');
    p(14,7,3,12,color); p(36,7,3,12,color); p(56,7,3,12,color);
    // Wide front lights
    p(74,18,8,5,'#ffffcc'); p(76,19,5,3,'#ffffff');
    p(0,18,6,5,'#ff1111');
    p(72,24,10,5,'#999aaa'); p(0,24,8,5,'#999aaa');
    // Low body kit
    p(0,30,82,2,'rgba(0,0,0,0.2)');
    p(14,22,54,1,'rgba(0,0,0,0.2)');
    CarRenderer._wheel(ctx, bx+17, by+34, 10, s);
    CarRenderer._wheel(ctx, bx+66, by+34, 10, s);
    p(0,27,5,3,'#666677');
  },

  _muscle(ctx, bx, by, color, s) {
    const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round((bx+x)*s),Math.round((by+y)*s),Math.round(w*s),Math.round(h*s)); };
    p(4,35,78,4,'rgba(0,0,0,0.3)');
    // Wide, boxy body
    p(0,14,88,18,color); p(2,17,84,13,color);
    p(16,7,48,9,color); p(14,10,52,7,color);
    p(18,8,20,7,'#1a3a5a'); p(42,8,18,7,'#1a3a5a');
    p(16,7,3,11,color); p(40,7,3,11,color); p(62,7,3,11,color);
    // Big headlights
    p(78,15,8,7,'#ffffaa'); p(80,16,5,5,'#ffffff');
    p(0,15,7,7,'#ff1111');
    // Hood scoop
    p(30,12,18,4,CarRenderer._darken(color)); p(32,13,14,2,'#111122');
    p(76,24,12,5,'#999aaa'); p(0,24,10,5,'#999aaa');
    p(16,21,62,1,'rgba(0,0,0,0.2)');
    CarRenderer._wheel(ctx, bx+18, by+35, 11, s);
    CarRenderer._wheel(ctx, bx+70, by+35, 11, s);
    p(0,28,6,3,'#666677'); p(4,28,4,3,'#666677');
  },

  _muscle2(ctx, bx, by, color, s) {
    const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round((bx+x)*s),Math.round((by+y)*s),Math.round(w*s),Math.round(h*s)); };
    p(4,36,80,4,'rgba(0,0,0,0.3)');
    p(0,13,88,20,color); p(2,16,84,15,color);
    p(14,6,52,9,color); p(12,9,56,7,color);
    p(16,7,22,7,'#1a3a5a'); p(42,7,20,7,'#1a3a5a');
    p(80,14,8,7,'#ffffaa');
    p(0,14,7,7,'#ff1111');
    p(28,10,22,5,CarRenderer._darken(color)); p(30,11,18,3,'#111122');
    p(78,24,10,6,'#999aaa'); p(0,24,8,6,'#999aaa');
    CarRenderer._wheel(ctx, bx+17, by+36, 12, s);
    CarRenderer._wheel(ctx, bx+72, by+36, 12, s);
    p(0,29,5,3,'#555566'); p(5,29,4,3,'#666677');
  },

  _sedan(ctx, bx, by, color, s) {
    const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round((bx+x)*s),Math.round((by+y)*s),Math.round(w*s),Math.round(h*s)); };
    p(4,34,76,4,'rgba(0,0,0,0.3)');
    p(0,16,84,16,color); p(2,19,80,11,color);
    p(12,8,52,10,color); p(10,11,56,7,color);
    p(14,9,20,8,'#1a3a5a'); p(36,9,20,8,'#1a3a5a'); p(58,9,10,8,'#1a3a5a');
    p(12,8,3,12,color); p(34,8,3,12,color); p(56,8,3,12,color);
    p(76,18,7,6,'#ffffaa'); p(78,19,4,4,'#ffffff');
    p(0,18,6,6,'#ff1111');
    p(74,25,9,4,'#999aaa'); p(0,25,8,4,'#999aaa');
    p(14,22,60,1,'rgba(0,0,0,0.2)');
    CarRenderer._wheel(ctx, bx+17, by+34, 10, s);
    CarRenderer._wheel(ctx, bx+66, by+34, 10, s);
    p(0,27,4,3,'#666677');
  },

  _supercar(ctx, bx, by, color, s) {
    const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round((bx+x)*s),Math.round((by+y)*s),Math.round(w*s),Math.round(h*s)); };
    p(4,34,76,4,'rgba(0,0,0,0.25)');
    // Very low, wide body
    p(4,18,76,14,color); p(0,21,82,11,color);
    // Cab
    p(20,10,36,10,color); p(18,13,40,8,color);
    p(22,11,16,7,'#1a3a5a'); p(40,11,14,7,'#1a3a5a');
    // Low roofline
    p(76,18,6,5,'#ffffcc'); p(78,19,4,3,'#ffffff');
    p(0,19,6,4,'#ff1111');
    // Side intakes
    p(0,26,10,4,CarRenderer._darken(color)); p(2,27,6,2,'#111122');
    // Splitter/diffuser
    p(0,30,82,3,'#222233'); p(0,31,82,1,'rgba(255,255,255,0.1)');
    p(74,22,8,6,'#888899'); p(0,22,6,6,'#888899');
    p(20,22,52,1,'rgba(0,0,0,0.2)');
    CarRenderer._wheel(ctx, bx+16, by+34, 10, s);
    CarRenderer._wheel(ctx, bx+66, by+34, 10, s);
    p(0,27,4,3,'#666677'); p(4,27,4,3,'#666677');
  },

  _supercar2(ctx, bx, by, color, s) {
    const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round((bx+x)*s),Math.round((by+y)*s),Math.round(w*s),Math.round(h*s)); };
    p(4,33,76,4,'rgba(0,0,0,0.25)');
    p(4,17,78,14,color); p(0,20,82,11,color);
    p(22,10,34,9,color); p(20,13,38,7,color);
    p(24,11,14,7,'#1a3a5a'); p(40,11,12,7,'#1a3a5a');
    p(77,17,5,5,'#ffffcc'); p(0,18,5,4,'#ff1111');
    p(0,27,8,3,CarRenderer._darken(color)); p(2,28,4,2,'#111122');
    p(72,27,10,3,CarRenderer._darken(color));
    p(0,30,82,3,'#222233');
    CarRenderer._wheel(ctx, bx+15, by+33, 10, s);
    CarRenderer._wheel(ctx, bx+67, by+33, 10, s);
    p(0,26,4,3,'#555566'); p(4,26,4,3,'#666677');
  },

  _hypercar(ctx, bx, by, color, s) {
    const p = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round((bx+x)*s),Math.round((by+y)*s),Math.round(w*s),Math.round(h*s)); };
    p(4,32,76,4,'rgba(0,0,0,0.2)');
    // Extreme low profile
    p(6,19,74,12,color); p(0,21,82,10,color);
    p(22,11,34,10,color); p(20,14,38,7,color);
    // Carbon accent lines
    p(0,21,82,1,'rgba(255,255,255,0.08)');
    p(24,12,14,6,'#1a3a5a'); p(40,12,12,6,'#1a3a5a');
    p(78,19,4,4,'#ffffee'); p(0,20,4,3,'#ff0022');
    // Wing
    p(0,14,8,5,CarRenderer._darken(color)); p(0,12,4,3,CarRenderer._darken(color));
    // Front splitter
    p(78,28,4,3,'#111'); p(0,29,82,2,'#111');
    // Side pods
    p(0,26,12,4,CarRenderer._darken(color)); p(2,27,8,2,'#0a0a1a');
    p(70,26,12,4,CarRenderer._darken(color));
    CarRenderer._wheel(ctx, bx+16, by+32, 10, s);
    CarRenderer._wheel(ctx, bx+66, by+32, 10, s);
    p(0,25,4,3,'#444455'); p(4,25,3,3,'#555566');
  },

  _darken(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n>>16)&255) - 40);
    const g = Math.max(0, ((n>>8)&255) - 40);
    const b = Math.max(0, (n&255) - 40);
    return `rgb(${r},${g},${b})`;
  },
};

// Helper to build an opponent Car object
function buildOpponentCar(opponentData) {
  const carData = CARS_DATA[opponentData.carId];
  const config = {
    color: carData.defaultColor,
    mods: { ...MOD_PRESETS[opponentData.modPreset] },
    tune: { launchRpm: 0.55, finalDrive: 1.0 },
  };
  return new Car(opponentData.carId, config);
}
