import { SKILLS, WEAPONS, ARMOR, ACCESSORIES } from './catalog.js';

const ALL={SKILL:SKILLS,WEAPON:WEAPONS,ARMOR,ACCESSORY:ACCESSORIES};
const find=(type,id)=>(ALL[type]||[]).find(x=>x.id===id);

export function listRpgShop(type){return (ALL[type]||[]).map(x=>({id:x.id,name:x.name,price:x.price,...(type==='WEAPON'?{atk:x.atk}:{}),...(type==='ARMOR'?{def:x.def}:{}),...(type==='ACCESSORY'?{luck:x.luck,energy:x.energy,dodge:x.dodge,damageBoost:x.damageBoost}:{})}));}

export async function purchaseRpg(env,userId,type,itemId){
  const item=find(type,itemId);if(!item)return {ok:false,error:'ITEM_NOT_FOUND'};
  const owned=await env.DB.prepare('SELECT quantity FROM rpg_inventory WHERE user_id=? AND item_id=?').bind(userId,item.id).first();
  if(owned)return {ok:false,error:'ALREADY_OWNED',item};
  const charged=await env.DB.prepare('UPDATE wallets SET balance=balance-? WHERE user_id=? AND balance>=?').bind(item.price,userId,item.price).run();
  if(!charged.meta?.changes)return {ok:false,error:'INSUFFICIENT'};
  try{
    await env.DB.prepare('INSERT INTO rpg_inventory(user_id,item_id,item_type,quantity) VALUES(?,?,?,1)').bind(userId,item.id,type).run();
    await env.DB.prepare('INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)').bind(userId,-item.price,'RPG_SHOP_PURCHASE','rpg_shop',crypto.randomUUID(),Math.floor(Date.now()/1000)).run();
  }catch(e){await env.DB.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=?').bind(item.price,userId).run();throw e;}
  return {ok:true,item};
}

export async function equipRpg(env,userId,type,itemId){
  const item=find(type,itemId);if(!item)return {ok:false,error:'ITEM_NOT_FOUND'};
  const owned=await env.DB.prepare('SELECT 1 FROM rpg_inventory WHERE user_id=? AND item_id=?').bind(userId,item.id).first();
  if(!owned)return {ok:false,error:'NOT_OWNED'};
  await env.DB.prepare('INSERT OR IGNORE INTO rpg_equipment(user_id) VALUES(?)').bind(userId).run();
  const column={WEAPON:'weapon_id',ARMOR:'armor_id',ACCESSORY:'accessory_id',SKILL:'skill_id'}[type];
  await env.DB.prepare(`UPDATE rpg_equipment SET ${column}=? WHERE user_id=?`).bind(item.id,userId).run();
  return {ok:true,item};
}

export async function getEquipment(env,userId){
  return env.DB.prepare('SELECT * FROM rpg_equipment WHERE user_id=?').bind(userId).first();
}
