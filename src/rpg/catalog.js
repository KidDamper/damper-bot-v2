export const SKILLS=[
{id:'skill_rasengan',name:'Rasengan',price:10000},{id:'skill_chidori',name:'Chidori',price:20000},{id:'skill_shadow_clone',name:'Shadow Clone',price:30000},{id:'skill_amaterasu',name:'Amaterasu',price:70000},{id:'skill_susanoo',name:'Susanoo',price:100000},{id:'skill_black_flash',name:'Black Flash',price:100000},{id:'skill_sharingan',name:'Sharingan',price:150000},{id:'skill_ultra_instinct',name:'Ultra Instinct',price:200000},{id:'skill_domain_expansion',name:'Domain Expansion',price:300000}
];
export const WEAPONS=[
{id:'weapon_iron_blade',name:'Iron Blade',price:5000,atk:10},{id:'weapon_steel_katana',name:'Steel Katana',price:20000,atk:25},{id:'weapon_cursed_blade',name:'Cursed Blade',price:50000,atk:45},{id:'weapon_crimson_executioner',name:'Crimson Executioner',price:125000,atk:75},{id:'weapon_void_reaper',name:'Void Reaper',price:300000,atk:120}
];
export const ARMOR=[
{id:'armor_traveler',name:'Traveler',price:5000,def:10},{id:'armor_iron_guard',name:'Iron Guard',price:20000,def:25},{id:'armor_cursed_armor',name:'Cursed Armor',price:50000,def:45},{id:'armor_crimson_armor',name:'Crimson Armor',price:125000,def:75},{id:'armor_void_armor',name:'Void Armor',price:300000,def:120}
];
export const ACCESSORIES=[
{id:'acc_lucky_charm',name:'Lucky Charm',price:10000,luck:1},{id:'acc_energy_core',name:'Energy Core',price:30000,energy:20},{id:'acc_vampire_ring',name:'Vampire Ring',price:60000,damageBoost:0.05},{id:'acc_cursed_eye',name:'Cursed Eye',price:100000,dodge:0.05},{id:'acc_phantom_wings',name:'Phantom Wings',price:150000,dodge:0.10},{id:'acc_void_core',name:'Void Core',price:300000,damageBoost:0.10}
];
export const NUMBERED=[];
export function rpgCatalog(type){return type==='SKILL'?SKILLS:type==='WEAPON'?WEAPONS:type==='ARMOR'?ARMOR:ACCESSORIES;}
export function rpgItem(type,id){return rpgCatalog(type).find(x=>x.id===id)||null;}
