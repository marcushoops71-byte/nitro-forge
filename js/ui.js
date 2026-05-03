// ===== NITRO FORGE - UI.JS =====

const UI = {
  screens: ['title', 'garage', 'shop', 'race-menu', 'race', 'results', 'records'],

  init() {
    this.updateHud();
  },

  show(screenId) {
    this.screens.forEach(id => {
      const el = document.getElementById(`screen-${id}`);
      if (el) el.classList.remove('active');
    });
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
      this.onScreenEnter(screenId);
    }
  },

  onScreenEnter(screenId) {
    if (screenId === 'title') {
      const c = Game.getPlayerCar();
      const canvas = document.getElementById('title-car-canvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      c.draw(ctx, 120, 30, 1.5);
      
      document.getElementById('title-stat-races').textContent = `${Game.state.stats.races} RACES`;
      document.getElementById('title-stat-wins').textContent = `${Game.state.stats.wins} WINS`;
      document.getElementById('title-best-et').textContent = `BEST: ${Game.state.stats.bestET < 99 ? Game.state.stats.bestET.toFixed(3) : '--.---'}`;
    }
    else if (screenId === 'garage') Garage.render();
    else if (screenId === 'shop') Garage.renderShop();
    else if (screenId === 'race-menu') Race.renderMenu();
    else if (screenId === 'records') Race.renderRecords();
  },

  updateHud() {
    document.getElementById('hud-money').textContent = this.formatMoney(Game.state.money);
    document.getElementById('hud-level').textContent = Game.state.level;
    document.getElementById('shop-money').textContent = this.formatMoney(Game.state.money);
  },

  formatMoney(num) {
    return num.toLocaleString();
  },

  toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  },

  alert(msg) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-body').innerHTML = msg;
    overlay.classList.remove('hidden');
    document.getElementById('modal-ok-btn').onclick = () => overlay.classList.add('hidden');
  }
};
