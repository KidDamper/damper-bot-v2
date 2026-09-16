export const CARDS = [
  {id:"c001",name:"Damper Spark",tier:"COMMON",price:2500},
  {id:"c002",name:"Neon Pulse",tier:"COMMON",price:2500},
  {id:"c003",name:"Static Bloom",tier:"COMMON",price:2500},
  {id:"r001",name:"Midnight Signal",tier:"RARE",price:10000},
  {id:"r002",name:"Chrome Phantom",tier:"RARE",price:10000},
  {id:"r003",name:"Blue Eclipse",tier:"RARE",price:10000},
  {id:"m001",name:"The Last Frequency",tier:"MYTHIC",price:40000},
  {id:"m002",name:"Void Crown",tier:"MYTHIC",price:40000},
  {id:"m003",name:"Zero Hour",tier:"MYTHIC",price:40000}
];

export const PETS = [
  {id:"p_lucky_cat",name:"Lucky Cat",tier:"COMMON",price:5000,luck:1},
  {id:"p_kitsune",name:"Kitsune",tier:"RARE",price:20000,luck:2},
  {id:"p_ancient_dragon",name:"Ancient Dragon",tier:"LEGENDARY",price:125000,luck:3},
  {id:"p_void_dragon",name:"Void Dragon",tier:"MYTHIC",price:300000,luck:4}
];

export const NUMBERED_DRAW_PRICE = 250000;
export const NUMBERED_COUNT = 16;

export function cardTier(tier) { return CARDS.filter(x => x.tier === String(tier).toUpperCase()); }
export function cardPrice(tier) { const c=cardTier(tier); return c[0]?.price||null; }
export function petCatalog() { return PETS; }
export function petById(id) { return PETS.find(x=>x.id===id)||null; }
export function numberedMissReward(allOwned=false) { return allOwned ? {coins:100000,xp:500} : {coins:5000,xp:25}; }
