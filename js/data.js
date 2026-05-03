// ===== NITRO FORGE - DATA.JS =====

const CARS_DATA = {
  metro_s: {
    id: 'metro_s', name: 'Metro Type-S', class: 'D', price: 0,
    desc: 'A nimble FWD hatchback. Great starter car.',
    baseHp: 158, baseTorque: 148, baseWeight: 2680, baseGrip: 0.70,
    gears: 6, redline: 7800,
    maxSpeedByGear: [38, 68, 96, 124, 148, 165],
    drawType: 'hatchback', defaultColor: '#e74c3c',
  },
  ronin_h: {
    id: 'ronin_h', name: 'Ronin Hatch', class: 'D', price: 8000,
    desc: 'Hot hatch with sporty suspension.',
    baseHp: 197, baseTorque: 192, baseWeight: 2850, baseGrip: 0.74,
    gears: 6, redline: 7500,
    maxSpeedByGear: [40, 72, 102, 132, 158, 175],
    drawType: 'hatchback2', defaultColor: '#2980b9',
  },
  shogun_gt: {
    id: 'shogun_gt', name: 'Shogun GT', class: 'C', price: 16000,
    desc: 'A sleek sports coupe with inline-6 power.',
    baseHp: 240, baseTorque: 230, baseWeight: 3100, baseGrip: 0.76,
    gears: 6, redline: 8200,
    maxSpeedByGear: [44, 80, 116, 150, 178, 198],
    drawType: 'coupe', defaultColor: '#8e44ad',
  },
  viper_muscle: {
    id: 'viper_muscle', name: 'Viper Muscle', class: 'C', price: 22000,
    desc: 'American V8 torque monster. Watch those tires.',
    baseHp: 375, baseTorque: 415, baseWeight: 3800, baseGrip: 0.66,
    gears: 5, redline: 6200,
    maxSpeedByGear: [52, 95, 135, 168, 195],
    drawType: 'muscle', defaultColor: '#c0392b',
  },
  horizon_r: {
    id: 'horizon_r', name: 'Horizon-R', class: 'B', price: 48000,
    desc: 'AWD twin-turbo. Legendary in the streets.',
    baseHp: 280, baseTorque: 290, baseWeight: 3200, baseGrip: 0.84,
    gears: 6, redline: 8000,
    maxSpeedByGear: [46, 85, 124, 162, 192, 215],
    drawType: 'coupe', defaultColor: '#27ae60',
  },
  thunder_v8: {
    id: 'thunder_v8', name: 'Thunder V8', class: 'B', price: 58000,
    desc: 'Big block V8. Brute force wins races.',
    baseHp: 445, baseTorque: 480, baseWeight: 4100, baseGrip: 0.70,
    gears: 5, redline: 6500,
    maxSpeedByGear: [58, 105, 148, 185, 218],
    drawType: 'muscle2', defaultColor: '#e67e22',
  },
  zenith_sport: {
    id: 'zenith_sport', name: 'Zenith Sport', class: 'A', price: 125000,
    desc: 'Italian exotic. Scream to 9000 RPM.',
    baseHp: 510, baseTorque: 398, baseWeight: 2900, baseGrip: 0.90,
    gears: 7, redline: 9000,
    maxSpeedByGear: [52, 95, 138, 175, 208, 232, 248],
    drawType: 'supercar', defaultColor: '#f39c12',
  },
  phantom_awd: {
    id: 'phantom_awd', name: 'Phantom AWD', class: 'A', price: 158000,
    desc: 'German precision. 0-60 in 3.1s.',
    baseHp: 580, baseTorque: 553, baseWeight: 3650, baseGrip: 0.88,
    gears: 8, redline: 7200,
    maxSpeedByGear: [55, 100, 142, 182, 214, 238, 255, 265],
    drawType: 'sedan', defaultColor: '#34495e',
  },
  venom_x: {
    id: 'venom_x', name: 'Venom-X', class: 'S', price: 380000,
    desc: 'Mid-engine supercar. Top speed: 240+.',
    baseHp: 710, baseTorque: 590, baseWeight: 2650, baseGrip: 0.95,
    gears: 7, redline: 9500,
    maxSpeedByGear: [60, 110, 158, 200, 232, 252, 268],
    drawType: 'supercar2', defaultColor: '#1abc9c',
  },
  forge_hyper: {
    id: 'forge_hyper', name: 'Forge Hypercar', class: 'S', price: 780000,
    desc: 'The pinnacle. Carbon fiber everywhere.',
    baseHp: 1001, baseTorque: 738, baseWeight: 2400, baseGrip: 0.98,
    gears: 7, redline: 10500,
    maxSpeedByGear: [68, 124, 176, 220, 255, 275, 290],
    drawType: 'hypercar', defaultColor: '#9b59b6',
  },
};

// ─── MODS ───
const MODS = {
  engine: [
    { name: 'Stock',    hp: 0,   price: 0,     label: '' },
    { name: 'Stage 1',  hp: 22,  price: 4500,  label: '+22hp' },
    { name: 'Stage 2',  hp: 55,  price: 14000, label: '+55hp' },
    { name: 'Stage 3',  hp: 110, price: 38000, label: '+110hp' },
  ],
  forced: [
    { name: 'Stock',          hp: 0,   price: 0,      label: '' },
    { name: 'Supercharger',   hp: 65,  price: 22000,  label: '+65hp' },
    { name: 'Single Turbo',   hp: 88,  price: 32000,  label: '+88hp' },
    { name: 'Twin Turbo',     hp: 160, price: 75000,  label: '+160hp' },
  ],
  exhaust: [
    { name: 'Stock',         hp: 0,  price: 0,     label: '' },
    { name: 'Cat-Back',      hp: 10, price: 2800,  label: '+10hp' },
    { name: 'Full Race',     hp: 26, price: 9500,  label: '+26hp' },
  ],
  intake: [
    { name: 'Stock',         hp: 0,  price: 0,    label: '' },
    { name: 'Cold Air',      hp: 8,  price: 1800, label: '+8hp' },
    { name: 'Race Intake',   hp: 16, price: 4800, label: '+16hp' },
  ],
  tires: [
    { name: 'Street',  grip: 0.70, label: 'Grip ★★☆☆☆', price: 0 },
    { name: 'Sport',   grip: 0.82, label: 'Grip ★★★☆☆', price: 2800 },
    { name: 'Race',    grip: 0.93, label: 'Grip ★★★★☆', price: 7500 },
    { name: 'Drag',    grip: 1.00, label: 'Grip ★★★★★', price: 12000 },
  ],
  suspension: [
    { name: 'Stock',  launch: 0,    price: 0,     label: '' },
    { name: 'Sport',  launch: 0.04, price: 3500,  label: 'Launch +4%' },
    { name: 'Race',   launch: 0.09, price: 9000,  label: 'Launch +9%' },
  ],
  nitrous: [
    { name: 'None',        hp: 0,   dur: 0,   price: 0,     label: '' },
    { name: 'Dry Shot',    hp: 50,  dur: 3.0, price: 5500,  label: '50hp/3s' },
    { name: 'Wet Shot',    hp: 105, dur: 3.5, price: 14000, label: '105hp/3.5s' },
    { name: 'Direct Port', hp: 200, dur: 4.0, price: 28000, label: '200hp/4s' },
  ],
  transmission: [
    { name: 'Stock',       shiftBonus: 0,    price: 0,     label: '' },
    { name: 'Stage 1',     shiftBonus: 0.03, price: 4500,  label: 'Shift +3%' },
    { name: 'Stage 2',     shiftBonus: 0.06, price: 11000, label: 'Shift +6%' },
    { name: 'Sequential',  shiftBonus: 0.10, price: 24000, label: 'Shift +10%' },
  ],
  weight: [
    { name: 'Stock',         reduction: 0,   price: 0,     label: '' },
    { name: 'Strip Out',     reduction: 120, price: 4200,  label: '-120 lbs' },
    { name: 'Full Strip',    reduction: 280, price: 13500, label: '-280 lbs' },
    { name: 'Carbon Fiber',  reduction: 450, price: 34000, label: '-450 lbs' },
  ],
  ecu: [
    { name: 'Stock',     boost: 0,    price: 0,     label: '' },
    { name: 'ECU Tune',  boost: 0.05, price: 7500,  label: '+5% power' },
    { name: 'Race ECU',  boost: 0.10, price: 19000, label: '+10% power' },
  ],
};

// ─── DEFAULT CONFIG ───
function defaultCarConfig(carId) {
  return {
    color: CARS_DATA[carId]?.defaultColor || '#e74c3c',
    mods: { engine:0, forced:0, exhaust:0, intake:0, tires:0, suspension:0, nitrous:0, transmission:0, weight:0, ecu:0 },
    tune: { launchRpm: 0.55, finalDrive: 1.0 },
  };
}

// ─── PAINT COLORS ───
const PAINT_COLORS = [
  '#e74c3c','#c0392b','#ff6b35','#e67e22','#f39c12','#f1c40f',
  '#2ecc71','#27ae60','#1abc9c','#3498db','#2980b9','#0066ff',
  '#9b59b6','#8e44ad','#e91e63','#ff69b4','#ffffff','#cccccc',
  '#888888','#444444','#222222','#111111','#8b4513','#d4a017',
];

// ─── OPPONENTS ───
const OPPONENTS = {
  street: [
    { name: 'Noob Nick',  carId: 'metro_s',    modPreset: 'stock',  skill: 0.55, reward: 300,  xp: 30  },
    { name: 'Casper K',   carId: 'metro_s',    modPreset: 'light',  skill: 0.60, reward: 500,  xp: 50  },
    { name: 'Drift Dana', carId: 'ronin_h',    modPreset: 'stock',  skill: 0.60, reward: 700,  xp: 60  },
    { name: 'Big Robbie', carId: 'ronin_h',    modPreset: 'light',  skill: 0.65, reward: 900,  xp: 75  },
    { name: 'Street Kay', carId: 'shogun_gt',  modPreset: 'stock',  skill: 0.65, reward: 1200, xp: 90  },
    { name: 'Turbo Tess', carId: 'shogun_gt',  modPreset: 'medium', skill: 0.70, reward: 1600, xp: 110 },
    { name: 'Blaze Nine', carId: 'viper_muscle',modPreset:'stock',  skill: 0.70, reward: 2000, xp: 130 },
    { name: 'Iron Mick',  carId: 'viper_muscle',modPreset:'light',  skill: 0.75, reward: 2500, xp: 150 },
  ],
  track: [
    { name: 'Rookie Rex',   carId: 'shogun_gt',  modPreset: 'light',  skill: 0.65, reward: 1800, xp: 120 },
    { name: 'Circuit Sam',  carId: 'horizon_r',  modPreset: 'stock',  skill: 0.68, reward: 2400, xp: 150 },
    { name: 'Apex Leila',   carId: 'horizon_r',  modPreset: 'medium', skill: 0.72, reward: 3200, xp: 180 },
    { name: 'Lap Lord Vex', carId: 'thunder_v8', modPreset: 'light',  skill: 0.74, reward: 4000, xp: 210 },
    { name: 'Vector Pro',   carId: 'zenith_sport',modPreset:'stock',  skill: 0.78, reward: 5500, xp: 250 },
    { name: 'The Machine',  carId: 'phantom_awd',modPreset: 'medium', skill: 0.82, reward: 7000, xp: 300 },
  ],
  touge: [
    { name: 'Ghost Rider',  carId: 'horizon_r',   modPreset: 'medium', skill: 0.75, reward: 4500, xp: 200 },
    { name: 'Night Stalker',carId: 'thunder_v8',  modPreset: 'medium', skill: 0.78, reward: 6000, xp: 240 },
    { name: 'Kodama',       carId: 'zenith_sport', modPreset:'heavy',  skill: 0.82, reward: 8000, xp: 300 },
    { name: 'Phantom Zero', carId: 'phantom_awd', modPreset: 'heavy',  skill: 0.86, reward:11000, xp: 380 },
    { name: '[BOSS] Forge', carId: 'forge_hyper', modPreset: 'medium', skill: 0.90, reward:20000, xp: 500 },
  ],
};

// ─── MOD PRESETS for opponents ───
const MOD_PRESETS = {
  stock:  { engine:0, forced:0, exhaust:0, intake:0, tires:0, suspension:0, nitrous:0, transmission:0, weight:0, ecu:0 },
  light:  { engine:1, forced:0, exhaust:1, intake:1, tires:1, suspension:0, nitrous:0, transmission:0, weight:0, ecu:0 },
  medium: { engine:2, forced:1, exhaust:1, intake:1, tires:2, suspension:1, nitrous:1, transmission:1, weight:1, ecu:1 },
  heavy:  { engine:3, forced:2, exhaust:2, intake:2, tires:3, suspension:2, nitrous:2, transmission:2, weight:2, ecu:2 },
};

// XP needed for each level
const LEVEL_XP = [0, 100, 250, 500, 900, 1500, 2400, 3700, 5500, 8000, 12000];
