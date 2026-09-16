import { WEAPONS, ARMOR, ACCESSORIES } from './catalog.js';

const find=(list,id)=>list.find(x=>x.id===id)||null;

export async function getRpgBonuses(env,userId){
  const e=await env.DB.prepare('SELECT weapon_id,armor_id,accessory_id FROM rpg_equipment WHERE user_id=?').bind(userId).first();
  if(!e)return {atk:0,def:0,energy:0,dodge:0,speed:0,damageBoost:0};
  const w=find(WEAPONS,e.weapon_id),a=find(ARMOR,e.armor_id),x=find(ACCESSORIES,e.accessory_id);
  return {atk:Number(w?.atk||0),def:Number(a?.def||0),energy:Number(x?.energy||0),dodge:Number(x?.dodge||0),speed:0,damageBoost:Number(x?.damageBoost||0)};
}

export function loadoutText(profile){
  const e=profile?.equipment||{};
  return `🎒 *RPG LOADOUT*\n\n⚔️ Weapon: ${e.weapon_id||'None'}\n🛡️ Armor: ${e.armor_id||'None'}\n💠 Accessory: ${e.accessory_id||'None'}\n🌀 Skill: ${e.skill_id||'None'}`;
}
