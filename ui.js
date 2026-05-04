// ===== NITRO FORGE - UI.JS =====

const UI = (() => {
  let currentScreen = 'title';

  function show(screenName) {
    // Stop race if leaving
    if (currentScreen === 'race' && screenName !== 'race') {
      Race.stop();
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + screenName);
    if (el) el.classList.add('active');
    currentScreen = screenName;

    // Screen-specific inits
    if (screenName === 'title')      renderTitle();
    if (screenName === 'garage')     Garage.render();
    if (screenName === 'shop')       renderShop();
    if (screenName === 'race-menu')  renderRaceMenu();
    if (screenName === 'records')    renderRecords();
    updateHUD();
  }

  function updateHUD() {
    document.getElementById('hud-money').textContent = Game.getCash().toLocaleString();
    document.getElementById('hud-level').textContent = Game.getLevel();
  }

  function renderTitle() {
    const stats = Game.getStats();
    document.getElementById('title-stat-races').textContent = stats.races + ' RACES';
    document.getElementById('title-stat-wins').textContent = stats.wins + ' WINS';
    document.getElementById('title-best-et').textContent = stats.bestET ? 'BEST: ' + stats.bestET + 's' : 'BEST: --.---';

    // Draw title car
    const canvas = document.getElementById('title-car-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const car = Game.getActiveCar();
    if (car) {
      car.draw(ctx, 50, 5, 2.4);
    }
  }

  function renderShop() {
    const shopMoney = document.getElementById('shop-money');
    if (shopMoney) shopMoney.textContent = Game.getCash().toLocaleString();

    const listEl = document.getElementById('car-list');
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.class || 'all';

    const ownedCars = Game.getOwnedCarIds();
    const activeCar = Game.getActiveCar();

    let carsToShow = Object.values(CARS_DATA).filter(cd =>
      activeFilter === 'all' || cd.class === activeFilter
    );

    listEl.innerHTML = carsToShow.map(cd => {
      const isOwned = ownedCars.includes(cd.id);
      const isActive = activeCar?.carId === cd.id;
      const canAfford = Game.getCash() >= cd.price;

      // Mini car canvas
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = 90; tmpCanvas.height = 40;
      tmpCanvas.className = 'car-card-canvas';
      const tmpCtx = tmpCanvas.getContext('2d');
      const tmpCar = new Car(cd.id, defaultCarConfig(cd.id));
      tmpCar.draw(tmpCtx, 2, 4, 1.0);
      const imgData = tmpCanvas.toDataURL();

      const classBadge = `<span style="
        background:${classColor(cd.class)};
        color:#000;padding:1px 5px;font-size:9px;font-weight:bold;
        margin-left:4px;
      ">${cd.class}</span>`;

      const actionHTML = isActive
        ? `<span class="text-green" style="font-size:10px">ACTIVE ✓</span>`
        : isOwned
        ? `<button class="btn btn-xs btn-green" data-carid="${cd.id}" data-action="select">SELECT</button>`
        : cd.price === 0
        ? `<button class="btn btn-xs btn-green" data-carid="${cd.id}" data-action="buy">FREE!</button>`
        : canAfford
        ? `<button class="btn btn-xs btn-primary" data-carid="${cd.id}" data-action="buy">BUY $${(cd.price/1000).toFixed(0)}K</button>`
        : `<span class="text-red" style="font-size:9px">$${cd.price.toLocaleString()}</span>`;

      return `
        <div class="car-card ${isOwned ? 'owned' : ''} ${isActive ? 'active-car' : ''}">
          <img src="${imgData}" width="90" height="40" style="image-rendering:pixelated;flex-shrink:0">
          <div class="car-card-info">
            <div class="car-card-name">${cd.name}${classBadge}</div>
            <div class="car-card-class" style="font-size:9px;color:var(--text-dim)">${cd.desc}</div>
            <div class="car-card-stats">
              <span>HP: <span>${cd.baseHp}</span></span>
              <span>WT: <span>${cd.baseWeight}</span></span>
            </div>
          </div>
          <div class="car-card-action">${actionHTML}</div>
        </div>
      `;
    }).join('');

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderShop();
      };
    });

    // Car action buttons
    listEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const carId = btn.dataset.carid;
        const action = btn.dataset.action;
        if (action === 'buy') buyCarConfirm(carId);
        if (action === 'select') {
          Game.setActiveCar(carId);
          renderShop();
          updateHUD();
          toast('🚗 ' + CARS_DATA[carId].name + ' selected!', 'info');
        }
      });
    });
  }

  function buyCarConfirm(carId) {
    const cd = CARS_DATA[carId];
    if (cd.price === 0) {
      Game.buyCar(carId);
      Game.setActiveCar(carId);
      renderShop();
      updateHUD();
      toast('🚗 ' + cd.name + ' acquired!', 'info');
      return;
    }
    if (Game.getCash() < cd.price) { toast('Not enough cash!', 'warn'); return; }
    confirm(
      `Buy the <strong>${cd.name}</strong> for <strong>$${cd.price.toLocaleString()}</strong>?`,
      () => {
        Game.spendCash(cd.price);
        Game.buyCar(carId);
        Game.setActiveCar(carId);
        renderShop();
        updateHUD();
        toast('🚗 ' + cd.name + ' purchased!', 'info');
      }
    );
  }

  function classColor(cls) {
    return { D:'#aaaaaa', C:'#44cc44', B:'#4488ff', A:'#cc44ff', S:'#ff8800' }[cls] || '#888';
  }

  function renderRaceMenu() {
    const activeCar = Game.getActiveCar();
    // Preview
    const previewEl = document.getElementById('race-menu-car-preview');
    const pc = document.createElement('canvas');
    pc.width = 110; pc.height = 44;
    pc.style.imageRendering = 'pixelated';
    const pCtx = pc.getContext('2d');
    activeCar.draw(pCtx, 4, 4, 1.3);
    previewEl.innerHTML = '';
    previewEl.appendChild(pc);

    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'flex:1;font-size:11px;';
    infoDiv.innerHTML = `
      <div style="font-family:var(--font-title);font-size:13px;color:var(--accent2)">${activeCar.data.name}</div>
      <div style="color:var(--text-dim);margin-top:2px">${activeCar.hp} HP · ${activeCar.rating} PR</div>
    `;
    previewEl.appendChild(infoDiv);

    const raceModeListEl = document.getElementById('race-mode-list');
    raceModeListEl.innerHTML = Object.entries(OPPONENTS).map(([modeKey, opps]) => {
      const modeLabel = { street:'🌃 STREET RACING', track:'🏁 TRACK DAY', touge:'⛰️ TOUGE BATTLE' }[modeKey] || modeKey;

      const rows = opps.map((opp, i) => {
        const oppCar = CARS_DATA[opp.carId];
        const won = Game.hasBeaten(modeKey, i);
        return `<div class="race-entry ${won ? 'text-dim' : ''}" data-mode="${modeKey}" data-index="${i}">
          <span class="race-entry-name">${opp.name} ${won ? '✓' : ''}</span>
          <span class="race-entry-opp" style="font-size:10px;color:var(--text-dim)">${oppCar.name}</span>
          <span class="race-entry-reward">$${opp.reward.toLocaleString()}</span>
        </div>`;
      }).join('');

      return `<div class="race-mode-section">
        <div class="race-mode-header">${modeLabel}</div>
        <div class="race-mode-body">${rows}</div>
      </div>`;
    }).join('');

    raceModeListEl.querySelectorAll('.race-entry').forEach(el => {
      el.addEventListener('click', () => {
        const mode = el.dataset.mode;
        const index = parseInt(el.dataset.index);
        startRace(mode, index);
      });
    });
  }

  function startRace(mode, index) {
    const oppData = OPPONENTS[mode][index];
    const playerCar = Game.getActiveCar();
    const oppCar = buildOpponentCar(oppData);

    const canvas = document.getElementById('race-canvas');
    Race.init(canvas);
    Race.setup(playerCar, oppCar, { ...oppData, mode, index });
    show('race');
    Race.start();
  }

  function renderRecords() {
    const el = document.getElementById('records-content');
    const stats = Game.getStats();
    const history = Game.getAllRaceHistory();

    // Best times per car
    const bestByCarId = {};
    history.forEach(r => {
      if (!bestByCarId[r.carId] || r.et < bestByCarId[r.carId].et) {
        bestByCarId[r.carId] = r;
      }
    });

    const bestRows = Object.values(bestByCarId).sort((a,b) => a.et - b.et).map(r =>
      `<div class="record-row">
        <span class="record-car-name">${CARS_DATA[r.carId]?.name || r.carId}</span>
        <span class="record-et">${r.et.toFixed(3)}s</span>
        <span class="record-speed">${r.topSpeed} mph</span>
      </div>`
    ).join('') || '<div style="color:var(--text-dim);padding:8px;font-size:11px">No races yet</div>';

    el.innerHTML = `
      <div class="record-section">
        <div class="record-section-title">🌟 GLOBAL STATS</div>
        <div class="record-row"><span>Total Races</span><span class="text-yellow">${stats.races}</span></div>
        <div class="record-row"><span>Wins</span><span class="text-green">${stats.wins}</span></div>
        <div class="record-row"><span>Losses</span><span class="text-red">${stats.losses}</span></div>
        <div class="record-row"><span>Cash Earned</span><span class="text-yellow">$${(stats.totalEarned||0).toLocaleString()}</span></div>
        <div class="record-row"><span>Best ET</span><span class="text-green">${stats.bestET ? stats.bestET + 's' : '--'}</span></div>
        <div class="record-row"><span>Top Speed</span><span class="text-green">${stats.topSpeed || '--'} mph</span></div>
      </div>
      <div class="record-section">
        <div class="record-section-title">🏆 BEST TIMES PER CAR</div>
        ${bestRows}
      </div>
    `;
  }

  function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  function confirm(msg, onOk) {
    const modal = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    const btn = document.getElementById('modal-ok-btn');
    body.innerHTML = msg;
    btn.textContent = 'CONFIRM';
    modal.classList.remove('hidden');

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = () => {
      modal.classList.add('hidden');
      onOk();
    };

    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    };
  }

  function modalMsg(msg) {
    const modal = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    const btn = document.getElementById('modal-ok-btn');
    body.innerHTML = msg;
    btn.textContent = 'OK';
    modal.classList.remove('hidden');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = () => modal.classList.add('hidden');
  }

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (currentScreen === 'race') {
      if (e.code === 'Space') { e.preventDefault(); Race.mainAction(); }
      if (e.code === 'KeyN')  Race.activateNos();
    }
  });

  return { show, updateHUD, toast, confirm: confirm, modalMsg };
})();
