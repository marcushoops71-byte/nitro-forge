// ============================================================
// NITRO FORGE - Garage Module
// ============================================================

const Garage = {
  activeTab: 'mycars',  // mycars | buy | mods | paint | race
  selectedModCat: 'engine',

  init() {
    this._bindTabs();
    this._bindCarNav();
  },

  _bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });
  },

  _bindCarNav() {
    document.getElementById('btnPrevCar')?.addEventListener('click', () => {
      const cars = Game.playerCars;
      const idx  = cars.indexOf(Game.activeCar);
      Game.activeCar = cars[(idx - 1 + cars.length) % cars.length];
      this.render();
    });
    document.getElementById('btnNextCar')?.addEventListener('click', () => {
      const cars = Game.playerCars;
      const idx  = cars.indexOf(Game.activeCar);
      Game.activeCar = cars[(idx + 1) % cars.length];
      this.render();
    });
  },

  render() {
    this._updateMoney();
    this._updateTabs();
    this._renderCarPreview();

    const content = document.getElementById('garageContent');
    switch (this.activeTab) {
      case 'mycars': this._renderMyCars(content);  break;
      case 'buy':    this._renderBuyCars(content); break;
      case 'mods':   this._renderMods(content);    break;
      case 'paint':  this._renderPaint(content);   break;
      case 'race':   this._renderRace(content);    break;
    }
  },

  _updateMoney() {
    const el = document.getElementById('moneyDisplay');
    if (el) el.textContent = '$' + Game.money.toLocaleString();
  },

  _updateTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === this.activeTab);
    });
    document.querySelectorAll('.garage-nav-btn').forEach(btn => btn.style.display = 'flex');
    if (this.activeTab === 'buy') {
      document.getElementById('btnPrevCar').style.display = 'none';
      document.getElementById('btnNextCar').style.display = 'none';
    }
  },

  _renderCarPreview() {
    const carData = GAME_DATA.cars.find(c => c.id === Game.activeCar);
    if (!carData) return;

    const canvas = document.getElementById('carPreviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, '#0a0916');
    bg.addColorStop(1, '#12102a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#ffffff08';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw car large
    const mods   = Game.carMods[Game.activeCar] || [];
    const color  = Game.carColors[Game.activeCar] || carData.color;
    const car    = new Car(carData, mods, color);
    car.draw(ctx, canvas.width / 2 + 20, canvas.height / 2 + 10);

    // Car name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(`${carData.make} ${carData.name}`, 12, 22);
    ctx.fillStyle = '#ffcc00';
    ctx.font = '12px "Courier New"';
    ctx.fillText(`CLASS: ${carData.class}`, 12, 40);

    // HP/TQ readout
    ctx.fillStyle = '#00ffcc';
    ctx.font = '11px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText(`${car.hp} HP  /  ${car.torque} TQ  /  ${car.weight} lbs`, canvas.width - 10, 22);

    // Stat bars
    const stats = carData.statDisplay;
    const modBoost = { power: 0, handling: 0, weight: 0, launch: 0 };
    mods.forEach(id => {
      const mod = findModById(id);
      if (!mod) return;
      if (mod.hpGain)        modBoost.power    += Math.round(mod.hpGain / 3);
      if (mod.torqueGain)    modBoost.power    += Math.round(mod.torqueGain / 5);
      if (mod.tractionGain)  modBoost.launch   += Math.round(mod.tractionGain * 100);
      if (mod.weightGain)    modBoost.weight   -= Math.round(mod.weightGain / 5);
      if (mod.shiftTimeGain) modBoost.handling += Math.round(mod.shiftTimeGain * 40);
    });

    const statRows = [
      { label: 'POWER',    val: stats.power,    bonus: modBoost.power    },
      { label: 'HANDLING', val: stats.handling, bonus: modBoost.handling },
      { label: 'WEIGHT',   val: stats.weight,   bonus: modBoost.weight   },
      { label: 'LAUNCH',   val: stats.launch,   bonus: modBoost.launch   },
    ];

    const barX = 12, barY = canvas.height - 72, barMaxW = 130, barH = 8, rowH = 16;
    statRows.forEach((s, i) => {
      const total = Math.min(100, s.val + s.bonus);
      const y = barY + i * rowH;
      ctx.fillStyle = '#ffffff44';
      ctx.font = '10px "Courier New"';
      ctx.textAlign = 'left';
      ctx.fillText(s.label, barX, y + 7);
      ctx.fillStyle = '#1a1a30';
      ctx.fillRect(barX + 68, y, barMaxW, barH);
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(barX + 68, y, barMaxW * (s.val / 100), barH);
      if (s.bonus > 0) {
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(barX + 68 + barMaxW * (s.val / 100), y, barMaxW * (s.bonus / 100), barH);
      }
    });
  },

  _renderMyCars(content) {
    content.innerHTML = '';
    const ownedCars = GAME_DATA.cars.filter(c => Game.playerCars.includes(c.id));
    ownedCars.forEach(carData => {
      const isActive = carData.id === Game.activeCar;
      const div = document.createElement('div');
      div.className = 'car-card' + (isActive ? ' active' : '');
      div.innerHTML = `
        <div class="car-card-header">
          <span class="car-name">${carData.make} ${carData.name}</span>
          <span class="car-class ${carData.class.toLowerCase()}">${carData.class}</span>
        </div>
        <div class="car-card-desc">${carData.description}</div>
        <div class="car-card-footer">
          <span class="car-stat">⚡ ${carData.stats.hp + (this._modBonusHP(carData.id))} HP</span>
          <button class="btn-select ${isActive ? 'active' : ''}" data-car="${carData.id}">
            ${isActive ? '✓ ACTIVE' : 'SELECT'}
          </button>
        </div>`;
      div.querySelector('.btn-select').addEventListener('click', () => {
        if (!isActive) {
          Game.activeCar = carData.id;
          this.render();
        }
      });
      content.appendChild(div);
    });
  },

  _modBonusHP(carId) {
    return (Game.carMods[carId] || []).reduce((acc, id) => {
      const m = findModById(id);
      return acc + (m?.hpGain || 0);
    }, 0);
  },

  _renderBuyCars(content) {
    content.innerHTML = '';
    const unowned = GAME_DATA.cars.filter(c => !Game.playerCars.includes(c.id));
    if (unowned.length === 0) {
      content.innerHTML = '<div class="empty-msg">You own every car. Legend.</div>';
      return;
    }
    unowned.forEach(carData => {
      const canAfford = Game.money >= carData.price;
      const div = document.createElement('div');
      div.className = 'car-card' + (!canAfford ? ' locked' : '');
      div.innerHTML = `
        <div class="car-card-header">
          <span class="car-name">${carData.make} ${carData.name}</span>
          <span class="car-class ${carData.class.toLowerCase()}">${carData.class}</span>
        </div>
        <div class="car-card-desc">${carData.description}</div>
        <div class="car-stats-row">
          <span>⚡ ${carData.stats.hp} HP</span>
          <span>🔩 ${carData.stats.torque} TQ</span>
          <span>⚖ ${carData.stats.weight} lbs</span>
        </div>
        <div class="car-card-footer">
          <span class="car-price ${canAfford ? 'can-afford' : 'cant-afford'}">$${carData.price.toLocaleString()}</span>
          <button class="btn-buy" data-car="${carData.id}" ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? 'BUY' : 'NEED $' + (carData.price - Game.money).toLocaleString()}
          </button>
        </div>`;
      if (canAfford) {
        div.querySelector('.btn-buy').addEventListener('click', () => {
          if (Game.buyCar(carData.id)) {
            Game.activeCar = carData.id;
            this.activeTab = 'mycars';
            this.render();
            this._toast(`${carData.name} purchased!`);
          }
        });
      }
      content.appendChild(div);
    });
  },

  _renderMods(content) {
    const carData = GAME_DATA.cars.find(c => c.id === Game.activeCar);
    const ownedMods = Game.carMods[Game.activeCar] || [];

    // Category tabs
    const cats = ['engine', 'turbo', 'tires', 'transmission', 'nitrous', 'weight'];
    const catIcons = { engine:'⚙', turbo:'💨', tires:'🔘', transmission:'⚙', nitrous:'💥', weight:'⚖' };

    content.innerHTML = `
      <div class="mod-cats">
        ${cats.map(c => `
          <button class="mod-cat-btn ${c === this.selectedModCat ? 'active' : ''}" data-cat="${c}">
            ${catIcons[c]} ${c.toUpperCase()}
          </button>`).join('')}
      </div>
      <div class="mod-list" id="modList"></div>`;

    content.querySelectorAll('.mod-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedModCat = btn.dataset.cat;
        this.render();
      });
    });

    const modList = document.getElementById('modList');
    const mods    = GAME_DATA.mods[this.selectedModCat];

    mods.forEach(mod => {
      const owned      = ownedMods.includes(mod.id);
      const reqMet     = !mod.requires || ownedMods.includes(mod.requires);
      const canAfford  = Game.money >= mod.price;
      const available  = !owned && reqMet;

      const item = document.createElement('div');
      item.className = `mod-item ${owned ? 'owned' : ''} ${!reqMet ? 'locked' : ''}`;

      item.innerHTML = `
        <div class="mod-item-main">
          <div class="mod-level-dots">
            ${[1,2,3].map(l => `<span class="dot ${mod.level >= l ? 'on' : ''}"></span>`).join('')}
          </div>
          <div class="mod-info">
            <div class="mod-name">${mod.name}</div>
            <div class="mod-desc">${mod.desc}</div>
            ${mod.requires && !ownedMods.includes(mod.requires) ?
              `<div class="mod-req">⚠ Requires previous stage</div>` : ''}
          </div>
        </div>
        <div class="mod-buy">
          ${owned
            ? `<span class="mod-owned-badge">✓ INSTALLED</span>`
            : `<span class="mod-price ${canAfford && reqMet ? 'can-afford' : 'cant-afford'}">
                $${mod.price.toLocaleString()}
               </span>
               <button class="btn-mod-buy" data-mod="${mod.id}"
                 ${(!canAfford || !reqMet) ? 'disabled' : ''}>
                 ${!reqMet ? 'LOCKED' : canAfford ? 'INSTALL' : 'BROKE'}
               </button>`
          }
        </div>`;

      if (available && canAfford) {
        item.querySelector('.btn-mod-buy')?.addEventListener('click', () => {
          if (Game.applyMod(Game.activeCar, mod.id)) {
            this.render();
            this._toast(`${mod.name} installed!`);
          }
        });
      }

      modList.appendChild(item);
    });
  },

  _renderPaint(content) {
    content.innerHTML = `
      <div class="paint-grid" id="paintGrid"></div>`;

    const grid = document.getElementById('paintGrid');
    const currentColor = Game.carColors[Game.activeCar];

    GAME_DATA.paintColors.forEach(col => {
      const isSelected = currentColor === col.hex ||
        (!currentColor && col.hex === GAME_DATA.cars.find(c => c.id === Game.activeCar)?.color);
      const swatch = document.createElement('div');
      swatch.className = 'paint-swatch' + (isSelected ? ' selected' : '');
      swatch.style.background = col.hex;
      swatch.title = col.name;
      swatch.innerHTML = `
        <span class="swatch-name">${col.name}</span>
        ${isSelected ? '<span class="swatch-check">✓</span>' : ''}`;
      swatch.addEventListener('click', () => {
        Game.carColors[Game.activeCar] = col.hex;
        Game.saveSave();
        this.render();
      });
      grid.appendChild(swatch);
    });
  },

  _renderRace(content) {
    content.innerHTML = '';

    const playerCar  = GAME_DATA.cars.find(c => c.id === Game.activeCar);
    const playerMods = Game.carMods[Game.activeCar] || [];
    const playerObj  = new Car(playerCar, playerMods);

    const classes = ['STREET', 'SPORT', 'RACE'];
    classes.forEach(cls => {
      const header = document.createElement('div');
      header.className = 'race-class-header';
      header.textContent = cls + ' CLASS';
      content.appendChild(header);

      const opponents = GAME_DATA.opponents.filter(o => o.class === cls);
      opponents.forEach(opp => {
        const oppCarData = GAME_DATA.cars.find(c => c.id === opp.carId);
        const item = document.createElement('div');
        item.className = 'race-card';

        const diffBar = Math.round(opp.difficulty * 100);
        const diffColor = opp.difficulty < 0.90 ? '#00ff88' :
                          opp.difficulty < 0.98 ? '#ffcc00' : '#ff4444';

        item.innerHTML = `
          <div class="race-card-left">
            <div class="race-opp-name">${opp.name}</div>
            <div class="race-opp-car">${oppCarData?.make} ${oppCarData?.name} · ${opp.modsLevel > 0 ? 'Stage ' + opp.modsLevel + ' mods' : 'Stock'}</div>
            <div class="race-opp-desc">${opp.desc}</div>
          </div>
          <div class="race-card-right">
            <div class="race-reward">$${opp.reward.toLocaleString()}</div>
            <div class="diff-bar-wrap">
              <div class="diff-bar" style="width:${Math.min(100,diffBar/1.1)}%; background:${diffColor}"></div>
            </div>
            <button class="btn-race" data-opp="${opp.id}">RACE</button>
          </div>`;

        item.querySelector('.btn-race').addEventListener('click', () => {
          Game.startRace(opp.id);
        });

        content.appendChild(item);
      });
    });
  },

  _toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  },
};
