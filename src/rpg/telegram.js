import { createBattle, playerAttack, playerDefend, playerRun, useSkill } from '../core/rpg-combat.js';
import { battleMenu, skillMenu, battleText } from '../core/rpg-ui.js';
import { equippedStats } from './equipment-stats.js';
import { settleRpgBattle } from './reward-service.js';

export function decodeBattle(value){try{return JSON.parse(value||'{}')}catch{return null}}

export async function startRpgBattle(env,userId,chatId,level=1){
  const gear=await equippedStats(env,userId);
  const battle=createBattle(level,null,gear.bonuses);
  const id=`rpg_${crypto.randomUUID().replaceAll('-','').slice(0,12)}`;
  const t=Math.floor(Date.now()/1000);
  await env.DB.prepare('INSERT INTO game_sessions(id,game_type,chat_id,player_id,state,stake,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,'RPG_BATTLE',String(chatId),userId,JSON.stringify(battle),0,t+1800,t).run();
  return{id,battle,gear};
}

export async function applyRpgAction(env,id,userId,action,skill=null){
  const row=await env.DB.prepare('SELECT * FROM game_sessions WHERE id=? AND player_id=? AND game_type=? AND result IS NULL AND reward_applied=0').bind(id,userId,'RPG_BATTLE').first();
  if(!row)return{ok:false,error:'BATTLE_ENDED'};
  const battle=decodeBattle(row.state);if(!battle||battle.status!=='ACTIVE')return{ok:false,error:'BATTLE_ENDED'};
  const r=action==='attack'?playerAttack(battle):action==='defend'?playerDefend(battle):action==='run'?playerRun(battle):action==='skill'?useSkill(battle,skill):{ok:false,error:'UNKNOWN_ACTION',battle};
  if(r?.ok===false)return r;
  if(r.status==='ACTIVE'){
    const saved=await env.DB.prepare('UPDATE game_sessions SET state=? WHERE id=? AND result IS NULL AND reward_applied=0').bind(JSON.stringify(r),id).run();
    if(!saved.meta?.changes)return{ok:false,error:'BATTLE_ALREADY_RESOLVED'};
    return{ok:true,battle:r,reward:null};
  }
  // Claim the terminal battle before doing multi-step reward work. State 2 means settlement is in progress; 1 means rewards are complete.
  const claimed=await env.DB.prepare('UPDATE game_sessions SET state=?,result=?,reward_applied=2 WHERE id=? AND result IS NULL AND reward_applied=0').bind(JSON.stringify(r),JSON.stringify({status:r.status}),id).run();
  if(!claimed.meta?.changes)return{ok:false,error:'BATTLE_ALREADY_RESOLVED'};
  try{
    const reward=await settleRpgBattle(env,userId,r);
    await env.DB.prepare('UPDATE game_sessions SET reward_applied=1 WHERE id=? AND reward_applied=2').bind(id).run();
    return{ok:true,battle:r,reward};
  }catch(e){
    console.error('RPG settlement failure',e);
    return{ok:false,error:'REWARD_SETTLEMENT_FAILED',battle:r};
  }
}

export const rpgKeyboardFor=(battle,id)=>battle.status==='ACTIVE'?battleMenu(id):null;
export const rpgSkillKeyboard=id=>skillMenu(id);
export const rpgMessage=battle=>battleText(battle);
