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
export function cardTier(tier){return CARDS.filter(x=>x.tier===String(tier).toUpperCase());}
export function cardPrice(tier){return cardTier(tier)[0]?.price||null;}
export function petCatalog(){return PETS;}
export function petById(id){return PETS.find(x=>x.id===id)||null;}
export function numberedMissReward(allOwned=false){return allOwned?{coins:100000,xp:500}:{coins:5000,xp:25};}

export const SKILLS=[
{id:'skill_rasengan',name:'Rasengan',price:10000},{id:'skill_chidori',name:'Chidori',price:20000},{id:'skill_shadow_clone',name:'Shadow Clone',price:30000},{id:'skill_amaterasu',name:'Amaterasu',price:70000},{id:'skill_susanoo',name:'Susanoo',price:100000},{id:'skill_black_flash',name:'Black Flash',price:100000},{id:'skill_sharingan',name:'Sharingan',price:150000},{id:'skill_ultra_instinct',name:'Ultra Instinct',price:200000},{id:'skill_domain_expansion',name:'Domain Expansion',price:300000}
];
export const WEAPONS=[
{id:'weapon_iron_blade',name:'Iron Blade',price:5000,atk:10},{id:'weapon_steel_katana',name:'Steel Katana',price:20000,atk:25},{id:'weapon_cursed_blade',name:'Cursed Blade',price:50000,atk:45},{id:'weapon_crimson_executioner',name:'Crimson Executioner',price:125000,atk:75},{id:'weapon_void_reaper',name:'Void Reaper',price:300000,atk:120}
];
export const ARMOR=[
{id:'armor_traveler',name:'Traveler',price:5000,def:10},{id:'armor_iron_guard',name:'Iron Guard',price:20000,def:25},{id:'armor_cursed',name:'Cursed Armor',price:50000,def:45},{id:'armor_crimson',name:'Crimson Armor',price:125000,def:75},{id:'armor_void',name:'Void Armor',price:300000,def:120}
];
export const ACCESSORIES=[
{id:'acc_lucky_charm',name:'Lucky Charm',price:10000,luck:1},{id:'acc_energy_core',name:'Energy Core',price:30000,energy:20},{id:'acc_vampire_ring',name:'Vampire Ring',price:60000,damageBoost:0.05},{id:'acc_cursed_eye',name:'Cursed Eye',price:100000,dodge:0.05},{id:'acc_phantom_wings',name:'Phantom Wings',price:150000,dodge:0.10},{id:'acc_void_core',name:'Void Core',price:300000,damageBoost:0.10}
];
export const NUMBERED=[];
