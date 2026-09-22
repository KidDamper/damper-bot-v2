import { SKILLS, WEAPONS, ARMOR, ACCESSORIES } from './catalog.js';
import { debit, credit } from '../core/wallet.js';

const now=()=>Math.floor(Date.now()/1000);
const groups={SKILL:SKILLS,WEAPON:WEAPONS,ARMOR,ACCESSORY:ACCESSORIES};
const findItem=(type,id)=>(groups[type]||[]).find(x=>x.id===id)||null;

export function listRpgShop(type){return (groups[type]||[]).map(x=>({...x}));}

export async function buyRpgItem(env,userId,type,itemId){
  const item=findItem(type,itemId);if(!item)return {ok:false,error:'ITEM_NOT_FOUND'};
  const owned=await env.DB.prepare('SELECT quantity FROM rpg_inventory WHERE user_id=? AND item_id=?').bind(userId,itemId).first();
  if(owned)return {ok:false,error:'ALREADY_OWNED',item};
  try{await debit(env,userId,item.price);}catch(e){if(e?.message==='INSUFFICIENT_BALANCE')return {ok:false,error:'INSUFFICIENT'};throw e;}
  try{
    await env.DB.prepare('INSERT INTO rpg_inventory(user_id,item_id,item_type,quantity) VALUES(?,?,?,1)').bind(userId,item.id,type).run();
    await env.DB.prepare('INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)').bind(userId,-item.price,'RPG_SHOP',`rpg_${type}`,crypto.randomUUID(),now()).run();
  }catch(e){await credit(env,userId,item.price);throw e;}
  return {ok:true,item};
}

export async function equipRpgItem(env,userId,type,itemId){
  const item=findItem(type,itemId);if(!item)return {ok:false,error:'ITEM_NOT_FOUND'};
  const owned=await env.DB.prepare('SELECT 1 FROM rpg_inventory WHERE user_id=? AND item_id=?').bind(userId,itemId).first();
  if(!owned)return {ok:false,error:'NOT_OWNED'};
  const column={WEAPON:'weapon_id',ARMOR:'armor_id',ACCESSORY:'accessory_id',SKILL:'skill_id'}[type];
  if(!column)return {ok:false,error:'INVALID_TYPE'};
  await env.DB.prepare('INSERT OR IGNORE INTO rpg_equipment(user_id) VALUES(?)').bind(userId).run();
  await env.DB.prepare(`UPDATE rpg_equipment SET ${column}=? WHERE user_id=?`).bind(itemId,userId).run();
  return {ok:true,item};
}

export async function getRpgInventory(env,userId){
  const [inv,equip]=await Promise.all([
    env.DB.prepare('SELECT item_id,item_type,quantity FROM rpg_inventory WHERE user_id=? ORDER BY item_type,item_id').bind(userId).all(),
    env.DB.prepare('SELECT weapon_id,armor_id,accessory_id,skill_id FROM rpg_equipment WHERE user_id=?').bind(userId).first()
  ]);
  return {items:inv.results||[],equipment:equip||{weapon_id:null,armor_id:null,accessory_id:null,skill_id:null}};
}
