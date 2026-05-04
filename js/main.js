// ===== NITRO FORGE - MAIN.JS =====

// ─── GAME STATE ───
const Game = (() => {
  const SAVE_KEY = 'nitroforge_save_v1';

  let state = {
    cash: 5000,
    xp: 0,
    level: 1,
    combo: 0,
    activeCarId: 'metro_s',
    ownedCars: { metro_s: defaultCarConfig('metro_s') },
    ownedMods: {},    // { carId: { category: [indices] } }
    beaten: {},       // { "mode_index": true }
    raceHistory: [],  // [{ carId, et, topSpeed, result, reaction }]
    stats: { races:0, wins:0, losses:0, bestET:null, topSpeed:0, totalEarned:0 },
  };

  // ── CARS ──
  function getActiveCar() {
    const carId = state.activeCarId;
    const config = state.ownedCars[carId];
    if (!config) return null;
    return new Car(carId, config);
  }

  function getOwnedCarIds() {
    return Object.keys(state.ownedCars);
  }

  function setActiveCar(carId) {
    if (!state.ownedCars[carId]) return;
    state.activeCarId = carId;
    save();
  }

  function buyCar(carId) {
    if (!state.ownedCars[carId]) {
      state.ownedCars[carId] = defaultCarConfig(carId);
    }
    save();
  }

  function prevCar() {
    const ids = Object.keys(state.ownedCars);
    const idx = ids.indexOf(state.activeCarId);
    state.activeCarId = ids[(idx - 1 + ids.length) % ids.length];
    save();
  }

  function nextCar() {
    const ids = Object.keys(state.ownedCars);
    const idx = ids.indexOf(state.activeCarId);
    state.activeCarId = ids[(idx + 1) % ids.length];
    save();
  }

  // ── MODS ──
  function getOwnedMods(carId, category) {
    return state.ownedMods?.[carId]?.[category] || [];
  }

  function addOwnedMod(carId, category, index) {
    if (!state.ownedMods[carId]) state.ownedMods[carId] = {};
    if (!state.ownedMods[carId][category]) state.ownedMods[carId][category] = [];
    if (!state.ownedMods[carId][category].includes(index)) {
      state.ownedMods[carId][category].push(index);
    }
    // Sync to ownedCars config
    const config = state.ownedCars[carId];
    if (config) config.mods[category] = index;
    save();
  }

  // ── ECONOMY ──
  function getCash() { return state.cash; }
  function addCash(amount) {
    state.cash += amount;
    state.stats.totalEarned = (state.stats.totalEarned || 0) + amount;
    save();
    UI.updateHUD();
  }
  function spendCash(amount) {
    if (state.cash < amount) return false;
    state.cash -= amount;
    save();
    UI.updateHUD();
    return true;
  }

  // ── XP / LEVEL ──
  function getLevel() { return state.level; }
  function addXP(xp) {
    state.xp += xp;
    const nextLevelXP = LEVEL_XP[state.level] || 99999;
    if (state.xp >= nextLevelXP && state.level < LEVEL_XP.length - 1) {
      state.level++;
      UI.toast('⭐ LEVEL UP! You are now Level ' + state.level, 'info');
    }
    save();
    UI.updateHUD();
  }

  // ── COMBO ──
  function addCombo() {
    state.combo = (state.combo || 0) + 1;
    if (state.combo >= 3) {
      addCash(state.combo * 100);
      UI.toast(`🔥 ${state.combo}x COMBO! +$${state.combo * 100}`, 'info');
    }
  }
  function resetCombo() { state.combo = 0; }

  // ── RACE RECORDS ──
  function recordRace(record) {
    state.raceHistory.push(record);
    if (state.raceHistory.length > 200) state.raceHistory.shift(); // cap
    state.stats.races++;
    if (record.result === 'win') state.stats.wins++;
    if (record.result === 'lose') { state.stats.losses++; resetCombo(); }
    if (!state.stats.bestET || record.et < state.stats.bestET) state.stats.bestET = record.et;
    if (record.topSpeed > (state.stats.topSpeed || 0)) state.stats.topSpeed = record.topSpeed;
    save();
  }

  function getRaceHistory(carId) {
    return state.raceHistory.filter(r => r.carId === carId);
  }

  function getAllRaceHistory() {
    return state.raceHistory;
  }

  function getStats() { return state.stats; }

  // ── BEATEN ──
  function hasBeaten(mode, index) {
    return !!state.beaten[mode + '_' + index];
  }

  function markBeaten(mode, index) {
    state.beaten[mode + '_' + index] = true;
    save();
  }

  // ── SAVE / LOAD ──
  function save() {
    // Sync active car config back to state
    const car = new Car(state.activeCarId, state.ownedCars[state.activeCarId]);
    state.ownedCars[state.activeCarId] = car.config;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch(e) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const loaded = JSON.parse(raw);
        // Merge carefully
        state = Object.assign(state, loaded);
        // Ensure metro_s is always owned
        if (!state.ownedCars.metro_s) {
          state.ownedCars.metro_s = defaultCarConfig('metro_s');
        }
      }
    } catch(e) {
      console.warn('Save load failed, starting fresh');
    }
  }

  function resetSave() {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }

  return {
    getActiveCar, getOwnedCarIds, setActiveCar, buyCar, prevCar, nextCar,
    getOwnedMods, addOwnedMod,
    getCash, addCash, spendCash,
    getLevel, addXP, addCombo, resetCombo,
    recordRace, getRaceHistory, getAllRaceHistory, getStats,
    hasBeaten, markBeaten,
    save, load, resetSave,
  };
})();

// ─── BOOT ───
(function boot() {
  Audio.init();
  Game.load();
  UI.show('title');

  // First-time welcome
  if (Game.getStats().races === 0) {
    setTimeout(() => {
      UI.toast('🏁 Welcome to Nitro Forge! Visit the Dealership to grab your free starter car.', 'info');
    }, 800);
  }

  // Service worker for offline (optional)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
