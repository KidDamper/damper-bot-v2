import { SKILLS, WEAPONS, ARMOR, ACCESSORIES } from './catalog.js';

const byId=list=>new Map(list.map(x=>[x.id,x]));
const weapons=byId(WEAPONS),armor=byId(ARMOR),accessories=byId(ACCESSORIES),skills=byId(SKILLS);

export async function loadEquipment(env,userId){
  const e=await env.DB.prepare('SELECT weapon_id,armor_id,accessory_id,skill_id FROM rpg_equipment WHERE user_id=?').bind(userId).first();
  return e||{weapon_id:null,armor_id:null,accessory_id:null,skill_id:null};
}

export async function equippedStats(env,userId){
  const e=await loadEquipment(env,userId);
  const w=weapons.get(e.weapon_id),a=armor.get(e.armor_id),x=accessories.get(e.accessory_id),s=skills.get(e.skill_id);
  return {equipment:e,weapon:w||null,armor:a||null,accessory:x||null,skill:s||null,bonuses:{atk:w?.atk||0,def:a?.def||0,energy:x?.energy||0,dodge:x?.dodge||0,damageBoost:x?.damageBoost||0,luck:x?.luck||0}};
}
