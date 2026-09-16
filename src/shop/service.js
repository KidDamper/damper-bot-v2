import { SKILLS, WEAPONS, ARMOR, ACCESSORIES, NUMBERED } from './catalog.js';

export const NUMBERED_DRAW_PRICE = 250000;
const catalog = new Map([...SKILLS.map(([id,name,price])=>[id,{id,name,price,type:'SKILL'}]), ...WEAPONS.map(([id,name,price,bonus])=>[id,{id,name,price,type:'WEAPON',bonus}]), ...ARMOR.map(([id,name,price,bonus])=>[id,{id,name,price,type:'ARMOR',bonus}]), ...ACCESSORIES.map(([id,name,price])=>[id,{id,name,price,type:'ACCESSORY'}])]);

const now=()=>Math.floor(Date.now()/1000);
export async function purchaseRpgItem(env,userId,itemId){
  const item=catalog.get(itemId); if(!item) return {ok:false,error:'ITEM_NOT_FOUND'};
  const u=await env.DB.prepare('SELECT w.balance FROM wallets w WHERE w.user_id=?').bind(userId).first();
  if(!u || u.balance<item.price) return {ok:false,error:'INSUFFICIENT'};
  const existing=await env.DB.prepare('SELECT quantity FROM rpg_inventory WHERE user_id=? AND item_id=?').bind(userId,item.id).first();
  if(existing) return {ok:false,error:'ALREADY_OWNED',item};
  const tx=crypto.randomUUID();
  await env.DB.prepare('UPDATE wallets SET balance=balance-? WHERE user_id=? AND balance>=?').bind(item.price,userId,item.price).run();
  await env.DB.prepare('INSERT INTO rpg_inventory(user_id,item_id,item_type,quantity) VALUES(?,?,?,1)').bind(userId,item.id,item.type).run();
  await env.DB.prepare('INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)').bind(userId,-item.price,'SHOP_PURCHASE','rpg_shop',tx,now()).run();
  return {ok:true,item,balance:u.balance-item.price};
}

export async function equipRpgItem(env,userId,itemId){
  const item=catalog.get(itemId); if(!item) return {ok:false,error:'ITEM_NOT_FOUND'};
  const owned=await env.DB.prepare('SELECT 1 FROM rpg_inventory WHERE user_id=? AND item_id=?').bind(userId,itemId).first();
  if(!owned) return {ok:false,error:'NOT_OWNED'};
  await env.DB.prepare('INSERT OR IGNORE INTO rpg_equipment(user_id) VALUES(?)').bind(userId).run();
  const col={WEAPON:'weapon_id',ARMOR:'armor_id',ACCESSORY:'accessory_id',SKILL:'skill_id'}[item.type];
  await env.DB.prepare(`UPDATE rpg_equipment SET ${col}=? WHERE user_id=?`).bind(itemId,userId).run();
  return {ok:true,item};
}

export async function buyPet(env,userId,petId){
  const pet=await env.DB.prepare('SELECT * FROM pets WHERE id=?').bind(petId).first();
  if(!pet) return {ok:false,error:'PET_NOT_FOUND'};
  const owned=await env.DB.prepare('SELECT 1 FROM user_pets WHERE user_id=? AND pet_id=?').bind(userId,petId).first();
  if(owned) return {ok:false,error:'ALREADY_OWNED',pet};
  const u=await env.DB.prepare('SELECT balance FROM wallets WHERE user_id=?').bind(userId).first();
  if(!u || u.balance<pet.price) return {ok:false,error:'INSUFFICIENT',pet};
  const tx=crypto.randomUUID();
  await env.DB.prepare('UPDATE wallets SET balance=balance-? WHERE user_id=? AND balance>=?').bind(pet.price,userId,pet.price).run();
  await env.DB.prepare('INSERT INTO user_pets(user_id,pet_id) VALUES(?,?)').bind(userId,petId).run();
  await env.DB.prepare('INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)').bind(userId,-pet.price,'SHOP_PURCHASE','pet_shop',tx,now()).run();
  return {ok:true,pet,balance:u.balance-pet.price};
}

export async function buyCard(env,userId,cardId){
  const card=await env.DB.prepare('SELECT * FROM cards WHERE id=?').bind(cardId).first();
  if(!card) return {ok:false,error:'CARD_NOT_FOUND'};
  const u=await env.DB.prepare('SELECT balance FROM wallets WHERE user_id=?').bind(userId).first();
  if(!u || u.balance<card.price) return {ok:false,error:'INSUFFICIENT',card};
  const tx=crypto.randomUUID();
  const owned=await env.DB.prepare('SELECT quantity FROM user_cards WHERE user_id=? AND card_id=?').bind(userId,cardId).first();
  await env.DB.prepare('UPDATE wallets SET balance=balance-? WHERE user_id=? AND balance>=?').bind(card.price,userId,card.price).run();
  if(owned) await env.DB.prepare('UPDATE user_cards SET quantity=quantity+1 WHERE user_id=? AND card_id=?').bind(userId,cardId).run();
  else await env.DB.prepare('INSERT INTO user_cards(user_id,card_id,quantity) VALUES(?,?,1)').bind(userId,cardId).run();
  await env.DB.prepare('INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)').bind(userId,-card.price,'SHOP_PURCHASE','card_shop',tx,now()).run();
  return {ok:true,card,duplicate:!!owned,balance:u.balance-card.price};
}

export async function drawNumbered(env,userId){
  const u=await env.DB.prepare('SELECT balance FROM wallets WHERE user_id=?').bind(userId).first();
  if(!u || u.balance<NUMBERED_DRAW_PRICE) return {ok:false,error:'INSUFFICIENT'};
  const owned=await env.DB.prepare('SELECT item_id FROM user_numbered_items WHERE user_id=?').bind(userId).all();
  const ownedSet=new Set((owned.results||[]).map(x=>Number(x.item_id)));
  if(ownedSet.size>=NUMBERED.length) {
    const coins=50000,xp=1000,tx=crypto.randomUUID();
    await env.DB.prepare('UPDATE wallets SET balance=balance-?+? WHERE user_id=?').bind(NUMBERED_DRAW_PRICE,coins,userId).run();
    await env.DB.prepare('INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)').bind(userId,coins-NUMBERED_DRAW_PRICE,'NUMBERED_COMPLETE','numbered_draw',tx,now()).run();
    await env.DB.prepare('UPDATE xp SET damper_xp=damper_xp+? WHERE user_id=?').bind(xp,userId).run();
    return {ok:true,complete:true,coins,xp};
  }
  const missing=NUMBERED.filter(x=>!ownedSet.has(x.id));
  const hit=Math.random()<0.003;
  const tx=crypto.randomUUID();
  await env.DB.prepare('UPDATE wallets SET balance=balance-? WHERE user_id=? AND balance>=?').bind(NUMBERED_DRAW_PRICE,userId,NUMBERED_DRAW_PRICE).run();
  if(hit){
    const item=missing[Math.floor(Math.random()*missing.length)];
    await env.DB.prepare('INSERT INTO user_numbered_items(user_id,item_id,discovered_at) VALUES(?,?,?)').bind(userId,item.id,now()).run();
    await env.DB.prepare('INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)').bind(userId,-NUMBERED_DRAW_PRICE,'NUMBERED_DISCOVERY','numbered_draw',tx,now()).run();
    return {ok:true,hit:true,item};
  }
  const missCoins=25000,xp=250;
  await env.DB.prepare('INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)').bind(userId,-NUMBERED_DRAW_PRICE,'NUMBERED_MISS','numbered_draw',tx,now()).run();
  await env.DB.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=?').bind(missCoins,userId).run();
  await env.DB.prepare('UPDATE xp SET damper_xp=damper_xp+? WHERE user_id=?').bind(xp,userId).run();
  return {ok:true,hit:false,coins:missCoins,xp};
}
