import { rpgStats, levelCost, RPG } from '../core/rpg.js';
import { checkProgress } from '../achievements/progress.js';

export async function getRpgProfile(env,userId){
  const row=await env.DB.prepare(`SELECT x.rpg_xp,x.rpg_level,u.damper_id,u.username FROM xp x JOIN users u ON u.id=x.user_id WHERE x.user_id=?`).bind(userId).first();
  if(!row)return null;
  const equipment=await env.DB.prepare('SELECT weapon_id,armor_id,accessory_id,skill_id FROM rpg_equipment WHERE user_id=?').bind(userId).first();
  const stats=rpgStats(Number(row.rpg_level));
  return {...row,stats,equipment:equipment||{weapon_id:null,armor_id:null,accessory_id:null,skill_id:null}};
}

export async function addRpgXp(env,userId,amount){
  const n=Math.max(0,Math.floor(Number(amount)||0));
  if(!n)return getRpgProfile(env,userId);
  await env.DB.prepare('UPDATE xp SET rpg_xp=rpg_xp+? WHERE user_id=?').bind(n,userId).run();
  await checkProgress(env,userId);
  return getRpgProfile(env,userId);
}

export async function levelUpRpg(env,userId){
  const row=await env.DB.prepare('SELECT rpg_xp,rpg_level FROM xp WHERE user_id=?').bind(userId).first();
  if(!row)return {ok:false,error:'NO_PROFILE'};
  const level=Number(row.rpg_level),next=level+1;
  if(next>RPG.maxLevel)return {ok:false,error:'MAX_LEVEL'};
  const cost=levelCost(next);if(!cost)return {ok:false,error:'MAX_LEVEL'};
  const [xpCost,coinCost]=cost;
  if(Number(row.rpg_xp)<xpCost)return {ok:false,error:'LOW_RPG_XP',xpNeeded:xpCost-Number(row.rpg_xp)};

  const wallet=await env.DB.prepare('UPDATE wallets SET balance=balance-? WHERE user_id=? AND balance>=?').bind(coinCost,userId,coinCost).run();
  if(!wallet.meta?.changes)return {ok:false,error:'INSUFFICIENT_COINS',coinsNeeded:coinCost};

  let xpSpent=false;
  try{
    const updated=await env.DB.prepare('UPDATE xp SET rpg_xp=rpg_xp-?,rpg_level=? WHERE user_id=? AND rpg_xp>=? AND rpg_level=?').bind(xpCost,next,userId,xpCost,level).run();
    if(!updated.meta?.changes)throw new Error('LEVEL_UP_RACE');
    xpSpent=true;
    await env.DB.prepare('INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)').bind(userId,-coinCost,'RPG_LEVEL_UP','rpg',crypto.randomUUID(),Math.floor(Date.now()/1000)).run();
  }catch(e){
    if(xpSpent)await env.DB.prepare('UPDATE xp SET rpg_xp=rpg_xp+?,rpg_level=? WHERE user_id=? AND rpg_level=?').bind(xpCost,level,userId,next).run();
    await env.DB.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=?').bind(coinCost,userId).run();
    throw e;
  }
  await checkProgress(env,userId);
  return {ok:true,level:next,cost:[xpCost,coinCost],stats:rpgStats(next)};
}
