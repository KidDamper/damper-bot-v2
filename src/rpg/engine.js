const ENEMIES = [
  { id: "blood_beast", name: "Blood Beast", tier: "BOSS", level: 35, hp: 900, atk: 70, def: 45 },
  { id: "thunder_oni", name: "Thunder Oni", tier: "BOSS", level: 38, hp: 1050, atk: 78, def: 50 },
  { id: "cursed_seer", name: "Cursed Seer", tier: "BOSS", level: 42, hp: 1200, atk: 88, def: 55 },
  { id: "void_emperor", name: "Void Emperor", tier: "BOSS", level: 50, hp: 1800, atk: 120, def: 70 },
  { id: "iron_hound", name: "Iron Hound", tier: "EASY", level: 4, hp: 85, atk: 14, def: 7 },
  { id: "grave_wolf", name: "Grave Wolf", tier: "EASY", level: 8, hp: 140, atk: 21, def: 11 },
  { id: "ash_knight", name: "Ash Knight", tier: "MEDIUM", level: 12, hp: 220, atk: 28, def: 15 },
  { id: "storm_revenant", name: "Storm Revenant", tier: "MEDIUM", level: 18, hp: 320, atk: 38, def: 23 },
  { id: "crimson_wraith", name: "Crimson Wraith", tier: "HARD", level: 24, hp: 470, atk: 52, def: 29 },
  { id: "void_hunter", name: "Void Hunter", tier: "ELITE", level: 32, hp: 760, atk: 72, def: 42 }
];

const SHOP_SKILLS = [
  ["rasengan", "Rasengan", 10000], ["chidori", "Chidori", 20000],
  ["shadow_clone", "Shadow Clone", 30000], ["amaterasu", "Amaterasu", 70000],
  ["susanoo", "Susanoo", 100000], ["black_flash", "Black Flash", 100000],
  ["sharingan", "Sharingan", 150000], ["ultra_instinct", "Ultra Instinct", 200000],
  ["domain_expansion", "Domain Expansion", 300000]
].map(([id,name,price]) => ({id,name,price}));

const SHOP_EQUIPMENT = [
  ["iron_blade", "Iron Blade", "WEAPON", 5000, 10, 0],
  ["steel_katana", "Steel Katana", "WEAPON", 20000, 25, 0],
  ["cursed_blade", "Cursed Blade", "WEAPON", 50000, 45, 0],
  ["crimson_executioner", "Crimson Executioner", "WEAPON", 125000, 75, 0],
  ["void_reaper", "Void Reaper", "WEAPON", 300000, 120, 0],
  ["traveler", "Traveler", "ARMOR", 5000, 0, 10],
  ["iron_guard", "Iron Guard", "ARMOR", 20000, 0, 25],
  ["cursed_armor", "Cursed Armor", "ARMOR", 50000, 0, 45],
  ["crimson_armor", "Crimson Armor", "ARMOR", 125000, 0, 75],
  ["void_armor", "Void Armor", "ARMOR", 300000, 0, 120]
].map(([id,name,type,price,atk,def]) => ({id,name,type,price,atk,def}));

const ACCESSORIES = [
  {id:"lucky_charm",name:"Lucky Charm",price:10000,description:"Small general luck passive."},
  {id:"energy_core",name:"Energy Core",price:30000,description:"Raises maximum energy by 20."},
  {id:"cursed_eye",name:"Cursed Eye",price:100000,description:"A rare combat-focused passive."},
  {id:"phantom_wings",name:"Phantom Wings",price:150000,description:"Improves evasive combat potential."},
  {id:"void_core",name:"Void Core",price:300000,description:"Prestige accessory with a strong combat passive."}
];

export const BASE_STATS = Object.freeze({ hp:100, atk:20, def:10, energy:50, speed:10 });

export function statsForLevel(level) {
  const n = Math.max(1, Math.min(50, Number(level) || 1));
  return {
    hp: 100 + 5 * (n - 1),
    atk: 20 + (n - 1),
    def: 10 + Math.floor((n - 1) / 2),
    energy: 50 + 2 * (n - 1),
    speed: 10 + Math.floor((n - 1) / 5)
  };
}

export function levelUpCost(level) {
  const n = Number(level) || 1;
  if (n < 1 || n >= 50) return null;
  if (n === 1) return { rpgXp:100, coins:1000 };
  if (n === 2) return { rpgXp:250, coins:2000 };
  if (n === 3) return { rpgXp:450, coins:4000 };
  if (n === 4) return { rpgXp:700, coins:7000 };
  if (n === 5) return { rpgXp:1000, coins:10000 };
  if (n === 6) return { rpgXp:1400, coins:15000 };
  if (n === 7) return { rpgXp:1900, coins:22000 };
  if (n === 8) return { rpgXp:2500, coins:30000 };
  if (n === 9) return { rpgXp:3200, coins:40000 };
  return { rpgXp: Math.floor(3200 + 900 * Math.pow(n - 9, 1.42)), coins: Math.floor(40000 + 12000 * Math.pow(n - 9, 1.32)) };
}

export function damage(attackerAtk, defenderDef, crit=false) {
  const base = Math.max(1, Math.floor(attackerAtk - defenderDef / 2));
  return crit ? Math.max(1, Math.floor(base * 1.5)) : base;
}

export function rollCrit(chance=0.10) { return Math.random() < chance; }
export function rollDodge(chance=0.05) { return Math.random() < Math.min(0.30, chance); }
export function runSucceeds(isBoss=false) { return !isBoss && Math.random() < 0.70; }

export function chooseEnemy(playerLevel, forcedId=null) {
  if (forcedId) return ENEMIES.find(e => e.id === forcedId) || null;
  const max = Math.min(50, Math.max(1, Number(playerLevel) || 1));
  const pool = ENEMIES.filter(e => e.tier !== "BOSS" && e.level <= max + 5);
  return (pool.length ? pool : ENEMIES.filter(e => e.tier !== "BOSS")).sort(() => Math.random() - 0.5)[0];
}

export function enemyList() { return ENEMIES; }
export function shopSkills() { return SHOP_SKILLS; }
export function shopEquipment() { return SHOP_EQUIPMENT; }
export function accessories() { return ACCESSORIES; }

export function skillEffect(skillId) {
  const effects = {
    rasengan: {type:"BURST",multiplier:2.0,cost:20},
    chidori: {type:"BURST",multiplier:2.4,cost:25},
    shadow_clone: {type:"EXTRA_ATTACK",multiplier:1.0,cost:30},
    amaterasu: {type:"DOT",multiplier:0.8,cost:35,turns:3},
    susanoo: {type:"DEFEND",multiplier:0,cost:30,turns:3},
    black_flash: {type:"CRIT",multiplier:3.0,cost:35},
    sharingan: {type:"DODGE",multiplier:0,cost:25,turns:3},
    ultra_instinct: {type:"DODGE",multiplier:0,cost:40,turns:3},
    domain_expansion: {type:"GUARANTEED",multiplier:2.2,cost:50,turns:3}
  };
  return effects[skillId] || null;
}

export function bossMechanic(enemy, turn, enemyHp, maxHp) {
  if (!enemy) return null;
  const ratio = enemyHp / maxHp;
  if (enemy.id === "blood_beast" && ratio <= 0.30) return {type:"ENRAGE",atkMultiplier:1.25};
  if (enemy.id === "thunder_oni" && turn % 3 === 0) return {type:"CHARGED_STRIKE",warning:true};
  if (enemy.id === "cursed_seer") return {type:"PREDICTION"};
  if (enemy.id === "void_emperor" && ratio <= 0.50 && ratio > 0.40) return {type:"VOID_PHASE",turns:3};
  return null;
}
