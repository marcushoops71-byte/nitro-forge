// ===== NITRO FORGE - MAIN.JS =====

const Game = {
  state: {
    money: 5000,
    xp: 0,
    level: 1,
    cars: [], // Array of saved car configs
    activeCarIndex: 0,
    stats: {
      races: 0,
      wins: 0,
      bestET: 99.999
    }
  },

  init() {
    this.load();
    
    // Give starter car if empty
    if (this.state.cars.length === 0) {
      this.state.cars.push({
        carId: 'metro_s',
        config: defaultCarConfig('metro_s')
      });
    }

    UI.init();
    Garage.init();
    Race.init();
    
    // Initialize Audio on first click
    document.body.addEventListener('click', () => {
      Audio.init();
      Audio.resume();
    }, { once: true });

    UI.show('title');
    this.updateLevel();
  },

  getPlayerCar() {
    const data = this.state.cars[this.state.activeCarIndex];
    return new Car(data.carId, data.config);
  },

  addMoney(amount) {
    this.state.money += amount;
    this.save();
    UI.updateHud();
  },

  addXp(amount) {
    this.state.xp += amount;
    this.updateLevel();
    this.save();
  },

  updateLevel() {
    let newLevel = 1;
    for (let i = 1; i < LEVEL_XP.length; i++) {
      if (this.state.xp >= LEVEL_XP[i]) newLevel = i + 1;
      else break;
    }
    if (newLevel > this.state.level) {
      this.state.level = newLevel;
      UI.toast(`LEVEL UP! You are now Level ${this.state.level}`, 'info');
    }
    UI.updateHud();
  },

  save() {
    try {
      localStorage.setItem('nitroForgeSave', JSON.stringify(this.state));
    } catch (e) {
      console.warn("Could not save game state.");
    }
  },

  load() {
    try {
      const saved = localStorage.getItem('nitroForgeSave');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn("Could not load game state.");
    }
  }
};

window.onload = () => Game.init();
