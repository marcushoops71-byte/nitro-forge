# 🏁 Nitro Forge — Pixel Drag Racing

A fully playable drag racing game built with **vanilla HTML, CSS & JavaScript** — no frameworks, no build tools, no installs required. Just open `index.html` and race.

> Inspired by classic mobile drag racers. This is an original work with original art, mechanics, and code.

---

## 🚗 Features

| Feature | Details |
|---|---|
| **10 unique cars** | D → S class, from hot hatches to hypercars |
| **Pixel art car renderer** | All cars drawn procedurally in Canvas 2D |
| **Full mod system** | Engine, forced induction, exhaust, intake, tires, suspension, nitrous, transmission, weight reduction, ECU |
| **Paint shop** | 24 colors + custom hex color picker |
| **Tune menu** | Launch RPM % and final drive ratio sliders |
| **Christmas Tree** | Authentic drag strip start sequence |
| **Shift quality system** | PERFECT / GOOD / EARLY / LATE with bonuses |
| **NOS system** | Dry Shot, Wet Shot, Direct Port |
| **Combo system** | Chain perfect shifts for bonus cash |
| **3 race modes** | Street Racing · Track Day · Touge Battle |
| **13+ opponents** | Escalating AI skill levels |
| **Web Audio engine sounds** | Procedural RPM-based engine audio |
| **LocalStorage save** | Auto-saves all progress |
| **PWA / Offline support** | Service worker included |
| **Keyboard support** | Space = Stage/Shift, N = NOS |

---

## 🕹️ How to Play

1. **Dealership** — grab the free Metro Type-S starter car
2. **Garage** — install mods, change paint, tune launch RPM
3. **Race Menu** — pick an opponent and hit the track
4. **Stage** — tap/click STAGE, wait for the green light
5. **Launch** — perfect timing on launch for best reaction time
6. **Shift** — tap SHIFT when RPM is in the red zone for PERFECT shifts
7. **NOS** — activate when you need a speed burst

### Shift Timing
| Zone | Result | Bonus |
|---|---|---|
| 96–100% redline | PERFECT | +4% + transmission bonus |
| 88–95% redline | GOOD | +1.5% |
| 72–87% redline | EARLY | -2% |
| <72% redline | LATE | -6% |

---

## 📁 File Structure

```
nitroforge/
├── index.html          # Main HTML + screen layout
├── sw.js               # Service worker (offline PWA)
├── css/
│   └── style.css       # All styles
└── js/
    ├── data.js         # Car data, mod tables, opponents
    ├── audio.js        # Web Audio API engine sounds
    ├── car.js          # Car class + pixel art renderer
    ├── race.js         # Race engine, physics, AI, canvas
    ├── garage.js       # Garage UI (mods/paint/tune)
    ├── ui.js           # Screen manager, shop, race menu
    └── main.js         # Game state, save/load, boot
```

---

## 🌐 Deploy to GitHub Pages

1. Push this repo to GitHub
2. Settings → Pages → Source: `main` branch, `/ (root)`
3. Done — playable at `https://yourusername.github.io/nitroforge`

---

## 🛠️ Modding / Extending

All game data is in `js/data.js`:

- **Add a car:** add an entry to `CARS_DATA` with `drawType` matching an existing renderer
- **Add a mod tier:** add an entry to any array in `MODS`
- **Add an opponent:** add to any array in `OPPONENTS`
- **Add a paint color:** add a hex string to `PAINT_COLORS`
- **Add a new car shape:** add a `_yourtype` method to `CarRenderer` in `car.js`

---

## 📜 License

MIT — free to use, modify, and distribute. Original work.
