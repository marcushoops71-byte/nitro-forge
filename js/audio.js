// ===== NITRO FORGE - AUDIO.JS =====

const Audio = (() => {
  let ctx = null;
  let engineNode = null, gainNode = null, distNode = null;
  let currentRpm = 800;
  let nosNode = null, nosGain = null;
  let enabled = true;

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = ctx.createGain();
      gainNode.gain.value = 0.18;
      distNode = ctx.createWaveShaper();
      distNode.curve = makeDistortionCurve(60);
      distNode.connect(gainNode);
      gainNode.connect(ctx.destination);

      engineNode = ctx.createOscillator();
      engineNode.type = 'sawtooth';
      engineNode.frequency.value = rpmToFreq(800);
      engineNode.connect(distNode);
      engineNode.start();
    } catch(e) { enabled = false; }
  }

  function rpmToFreq(rpm) {
    return 30 + (rpm / 10500) * 140;
  }

  function makeDistortionCurve(amount) {
    const n = 256, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  function setRpm(rpm, instant = false) {
    if (!enabled || !ctx || !engineNode) return;
    currentRpm = rpm;
    const freq = rpmToFreq(rpm);
    const vol = 0.05 + (rpm / 10500) * 0.22;
    if (instant) {
      engineNode.frequency.value = freq;
      gainNode.gain.value = vol;
    } else {
      engineNode.frequency.setTargetAtTime(freq, ctx.currentTime, 0.04);
      gainNode.gain.setTargetAtTime(vol, ctx.currentTime, 0.04);
    }
  }

  function playShift() {
    if (!enabled || !ctx) return;
    // Brief blip: RPM drop sound
    const blip = ctx.createOscillator();
    const g = ctx.createGain();
    blip.type = 'sawtooth';
    blip.frequency.value = rpmToFreq(currentRpm);
    blip.frequency.setTargetAtTime(rpmToFreq(currentRpm * 0.65), ctx.currentTime, 0.02);
    g.gain.value = 0.12;
    g.gain.setTargetAtTime(0, ctx.currentTime + 0.15, 0.03);
    blip.connect(g);
    g.connect(ctx.destination);
    blip.start();
    blip.stop(ctx.currentTime + 0.3);
  }

  function playPerfectShift() {
    if (!enabled || !ctx) return;
    playShift();
    // Metallic ping
    const ping = ctx.createOscillator();
    const pg = ctx.createGain();
    ping.type = 'sine';
    ping.frequency.value = 1400;
    pg.gain.value = 0.06;
    pg.gain.setTargetAtTime(0, ctx.currentTime + 0.05, 0.06);
    ping.connect(pg);
    pg.connect(ctx.destination);
    ping.start();
    ping.stop(ctx.currentTime + 0.3);
  }

  function playLaunch() {
    if (!enabled || !ctx) return;
    const noise = ctx.createOscillator();
    const ng = ctx.createGain();
    noise.type = 'sawtooth';
    noise.frequency.value = 80;
    noise.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.4);
    ng.gain.value = 0.25;
    ng.gain.setTargetAtTime(0.1, ctx.currentTime + 0.3, 0.1);
    noise.connect(ng);
    ng.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.8);
  }

  function startNos() {
    if (!enabled || !ctx) return;
    if (nosNode) return;
    nosNode = ctx.createOscillator();
    nosGain = ctx.createGain();
    nosNode.type = 'sine';
    nosNode.frequency.value = 3200;
    nosGain.gain.value = 0;
    nosGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.1);
    nosNode.connect(nosGain);
    nosGain.connect(ctx.destination);
    nosNode.start();
  }

  function stopNos() {
    if (!nosNode) return;
    nosGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    nosNode.stop(ctx.currentTime + 0.2);
    nosNode = null; nosGain = null;
  }

  function playRedline() {
    if (!enabled || !ctx) return;
    const r = ctx.createOscillator();
    const rg = ctx.createGain();
    r.type = 'square';
    r.frequency.value = 55;
    rg.gain.value = 0.07;
    rg.gain.setTargetAtTime(0, ctx.currentTime + 0.1, 0.02);
    r.connect(rg);
    rg.connect(ctx.destination);
    r.start();
    r.stop(ctx.currentTime + 0.2);
  }

  function idle() {
    setRpm(850 + Math.random() * 50);
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  return { init, setRpm, playShift, playPerfectShift, playLaunch, startNos, stopNos, playRedline, idle, resume };
})();
