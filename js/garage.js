// ===== NITRO FORGE - GARAGE.JS =====

const Garage = (() => {
  let activeTab = 'mods';

  function render() {
    renderCarDisplay();
    renderTab(activeTab);
    setupTabBtns();
    setupCarNav();
  }

  function renderCarDisplay() {
    const car = Game.getActiveCar();
    if (!car) return;

    // Canvas
    const canvas = document.getElementById('garage-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    car.draw(ctx, 40, 20, 2.0);

    // Car name in nav
    document.getElementById('garage-car-name').textContent = car.data.name;

    // Stat bars
    const pct = car.getStatPercents();
    document.getElementById('stat-hp-bar').style.width = pct.hp + '%';
    document.getElementById('stat-hp-val').textContent = car.hp + ' HP';
    document.getElementById('stat-wt-bar').style.width = pct.wt + '%';
    document.getElementById('stat-wt-val').textContent = car.weight + ' lb';
    document.getElementById('stat-gr-bar').style.width = pct.gr + '%';
    document.getElementById('stat-gr-val').textContent = (car.grip * 100).toFixed(0) + '%';
    document.getElementById('stat-pr-bar').style.width = pct.pr + '%';
    document.getElementById('stat-pr-val').textContent = car.rating + ' PR';
  }

  function setupTabBtns() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        renderTab(activeTab);
      };
    });
  }

  function setupCarNav() {
    document.getElementById('prev-car-btn').onclick = () => {
      Game.prevCar(); render();
    };
    document.getElementById('next-car-btn').onclick = () => {
      Game.nextCar(); render();
    };
  }

  function renderTab(tab) {
    const el = document.getElementById('garage-tab-content');
    if (tab === 'mods')   el.innerHTML = buildModsHTML();
    if (tab === 'paint')  el.innerHTML = buildPaintHTML();
    if (tab === 'tune')   el.innerHTML = buildTuneHTML();
    if (tab === 'info')   el.innerHTML = buildInfoHTML();
    attachTabEvents(tab);
  }

  function buildModsHTML() {
    const car = Game.getActiveCar();
    const mods = car.config.mods;
    const cash = Game.getCash();

    const categories = [
      { key: 'engine',      label: '🔧 ENGINE INTERNALS' },
      { key: 'forced',      label: '💨 FORCED INDUCTION' },
      { key: 'exhaust',     label: '🔊 EXHAUST' },
      { key: 'intake',      label: '🌬️ INTAKE' },
      { key: 'tires',       label: '🛞 TIRES' },
      { key: 'suspension',  label: '🏗️ SUSPENSION' },
      { key: 'nitrous',     label: '⚡ NITROUS' },
      { key: 'transmission',label: '⚙️ TRANSMISSION' },
      { key: 'weight',      label: '⚖️ WEIGHT REDUCTION' },
      { key: 'ecu',         label: '💻 ECU' },
    ];

    return categories.map(cat => {
      const options = MODS[cat.key];
      const owned = Game.getOwnedMods(car.carId, cat.key);
      const active = mods[cat.key];

      const optionHTML = options.map((opt, i) => {
        const isActive = i === active;
        const isOwned = owned.includes(i) || i === 0;
        const canAfford = cash >= opt.price;
        const cls = isActive ? 'mod-option active' : isOwned ? 'mod-option' : canAfford ? 'mod-option' : 'mod-option locked';
        const priceText = i === 0 ? '<span class="mod-price owned">STOCK</span>'
          : isOwned ? '<span class="mod-price owned">OWNED</span>'
          : `<span class="mod-price ${canAfford ? '' : 'text-red'}">$${opt.price.toLocaleString()}</span>`;

        const hpLabel = opt.hp ? `+${opt.hp}hp` : opt.grip ? `grip ${opt.grip}` : opt.label || '';

        return `<div class="mod-option ${isActive ? 'active' : isOwned ? '' : 'buyable'}" 
                  data-category="${cat.key}" data-index="${i}" 
                  style="${isOwned || i===0 ? 'cursor:pointer' : canAfford ? 'cursor:pointer' : 'cursor:not-allowed; opacity:0.45'}">
          <span class="mod-name">${opt.name}</span>
          <span class="mod-hp">${hpLabel}</span>
          ${priceText}
        </div>`;
      }).join('');

      return `<div class="mod-category">
        <div class="mod-category-title">${cat.label}</div>
        <div class="mod-options">${optionHTML}</div>
      </div>`;
    }).join('');
  }

  function buildPaintHTML() {
    const car = Game.getActiveCar();
    const currentColor = car.config.color;

    const swatches = PAINT_COLORS.map(c =>
      `<div class="paint-swatch ${c === currentColor ? 'active' : ''}" 
          data-color="${c}" style="background:${c}"></div>`
    ).join('');

    return `<div style="padding:8px 0">
      <div style="font-size:10px;color:var(--text-dim);margin-bottom:8px;letter-spacing:1px;">SELECT PAINT COLOR</div>
      <div class="paint-grid">${swatches}</div>
      <div style="margin-top:12px;font-size:10px;color:var(--text-dim)">
        Custom hex: <input id="custom-color-input" type="color" value="${currentColor}" style="margin-left:6px;width:40px;height:24px;cursor:pointer;border:none;background:none;">
      </div>
    </div>`;
  }

  function buildTuneHTML() {
    const car = Game.getActiveCar();
    const tune = car.config.tune;
    const launchPct = Math.round((tune.launchRpm || 0.55) * 100);
    const fd = tune.finalDrive || 1.0;

    return `<div class="tune-section">
      <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-bottom:10px;">⚙️ FINE TUNE YOUR SETUP</div>
      
      <div class="tune-item">
        <span class="tune-label">LAUNCH RPM %</span>
        <input type="range" class="tune-slider" id="tune-launch" min="30" max="85" value="${launchPct}">
        <span class="tune-value" id="tune-launch-val">${launchPct}%</span>
      </div>
      <div style="font-size:9px;color:var(--text-dim);padding:0 8px 8px;">Higher = more wheelspin but faster launch if timed right</div>

      <div class="tune-item">
        <span class="tune-label">FINAL DRIVE RATIO</span>
        <input type="range" class="tune-slider" id="tune-fd" min="80" max="120" value="${Math.round(fd * 100)}">
        <span class="tune-value" id="tune-fd-val">${fd.toFixed(2)}</span>
      </div>
      <div style="font-size:9px;color:var(--text-dim);padding:0 8px 8px;">Lower = better top speed, Higher = better acceleration</div>

      <div style="margin-top:12px;padding:8px;background:var(--bg2);border:1px solid var(--border);font-size:10px;color:var(--text-dim)">
        💡 Optimal launch RPM: ~${Math.round(car.data.redline * 0.55 / 100) * 100} — ${Math.round(car.data.redline * 0.72 / 100) * 100}
      </div>

      <button class="btn btn-dim" id="btn-tune-reset" style="margin-top:10px;width:100%">↩ RESET TO DEFAULT</button>
    </div>`;
  }

  function buildInfoHTML() {
    const car = Game.getActiveCar();
    const d = car.data;
    const raceHistory = Game.getRaceHistory(car.carId);
    const bestET = raceHistory.length ? Math.min(...raceHistory.map(r => r.et)).toFixed(3) : '--';
    const wins = raceHistory.filter(r => r.result === 'win').length;
    const losses = raceHistory.filter(r => r.result === 'lose').length;

    return `<div style="padding:8px 0">
      <div class="mod-category-title">📋 CAR INFO</div>
      <div class="record-row"><span>Name</span><span class="text-yellow">${d.name}</span></div>
      <div class="record-row"><span>Class</span><span class="text-yellow">${d.class}</span></div>
      <div class="record-row"><span>Engine</span><span>${car.hp} HP</span></div>
      <div class="record-row"><span>Weight</span><span>${car.weight} lbs</span></div>
      <div class="record-row"><span>Grip</span><span>${(car.grip * 100).toFixed(0)}%</span></div>
      <div class="record-row"><span>Rating</span><span class="text-green">${car.rating} PR</span></div>
      <div class="record-row"><span>Gears</span><span>${car.gears}</span></div>
      <div class="record-row"><span>Redline</span><span>${d.redline.toLocaleString()} RPM</span></div>

      <div class="mod-category-title" style="margin-top:14px;">🏁 RACE STATS</div>
      <div class="record-row"><span>Best ET</span><span class="text-green">${bestET}${bestET !== '--' ? 's' : ''}</span></div>
      <div class="record-row"><span>Wins</span><span class="text-green">${wins}</span></div>
      <div class="record-row"><span>Losses</span><span class="text-red">${losses}</span></div>
      <div class="record-row"><span>W/L Ratio</span><span>${losses > 0 ? (wins/losses).toFixed(2) : wins > 0 ? '∞' : '--'}</span></div>

      <div style="padding:10px 0;font-size:10px;color:var(--text-dim);line-height:1.7">${d.desc}</div>
    </div>`;
  }

  function attachTabEvents(tab) {
    if (tab === 'mods') {
      document.querySelectorAll('.mod-option').forEach(el => {
        el.addEventListener('click', () => {
          const cat = el.dataset.category;
          const idx = parseInt(el.dataset.index);
          handleModClick(cat, idx);
        });
      });
    }

    if (tab === 'paint') {
      document.querySelectorAll('.paint-swatch').forEach(el => {
        el.addEventListener('click', () => {
          const color = el.dataset.color;
          const car = Game.getActiveCar();
          car.config.color = color;
          car._computeStats();
          Game.save();
          render();
        });
      });
      const customInput = document.getElementById('custom-color-input');
      if (customInput) {
        customInput.addEventListener('input', (e) => {
          const car = Game.getActiveCar();
          car.config.color = e.target.value;
          car._computeStats();
          Game.save();
          renderCarDisplay();
        });
      }
    }

    if (tab === 'tune') {
      const launchSlider = document.getElementById('tune-launch');
      const fdSlider = document.getElementById('tune-fd');
      if (launchSlider) {
        launchSlider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value) / 100;
          document.getElementById('tune-launch-val').textContent = Math.round(val * 100) + '%';
          const car = Game.getActiveCar();
          car.config.tune.launchRpm = val;
          car._computeStats();
          Game.save();
        });
      }
      if (fdSlider) {
        fdSlider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value) / 100;
          document.getElementById('tune-fd-val').textContent = val.toFixed(2);
          const car = Game.getActiveCar();
          car.config.tune.finalDrive = val;
          car._computeStats();
          Game.save();
        });
      }
      const resetBtn = document.getElementById('btn-tune-reset');
      if (resetBtn) {
        resetBtn.onclick = () => {
          const car = Game.getActiveCar();
          car.config.tune = { launchRpm: 0.55, finalDrive: 1.0 };
          car._computeStats();
          Game.save();
          renderTab('tune');
          UI.toast('Tune reset to default', 'info');
        };
      }
    }
  }

  function handleModClick(category, index) {
    const car = Game.getActiveCar();
    const mod = MODS[category][index];
    const owned = Game.getOwnedMods(car.carId, category);

    if (index === 0 || owned.includes(index)) {
      // Just equip it
      car.config.mods[category] = index;
      car._computeStats();
      Game.save();
      renderTab('mods');
      renderCarDisplay();
      UI.toast(`Equipped: ${mod.name}`, 'info');
    } else {
      // Try to buy
      if (Game.getCash() < mod.price) {
        UI.toast(`Not enough cash! Need $${mod.price.toLocaleString()}`, 'warn');
        return;
      }
      UI.confirm(
        `Buy <strong>${mod.name}</strong> for <strong>$${mod.price.toLocaleString()}</strong>?`,
        () => {
          Game.spendCash(mod.price);
          Game.addOwnedMod(car.carId, category, index);
          car.config.mods[category] = index;
          car._computeStats();
          Game.save();
          renderTab('mods');
          renderCarDisplay();
          UI.toast(`✅ Installed: ${mod.name}`, 'info');
        }
      );
    }
  }

  return { render };
})();
