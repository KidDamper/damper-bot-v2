import { createBattle, playerAttack, playerDefend, playerRun, useSkill } from '../core/rpg-combat.js';
import { battleMenu, skillMenu, battleText } from '../core/rpg-ui.js';

export function decodeBattle(value){try{return JSON.parse(value||'{}')}catch{return null}}
export async function startRpgBattle(env,userId,chatId){const battle=createBattle(1);const id=`rpg_${crypto.randomUUID().replaceAll('-','').slice(0,12)}`;const t=Math.floor(Date.now()/1000);await env.DB.prepare('INSERT INTO game_sessions(id,game_type,chat_id,player_id,state,stake,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,'RPG_BATTLE',String(chatId),userId,JSON.stringify(battle),0,t+1800,t).run();return{id,battle};}
export async function applyRpgAction(env,id,userId,action,skill=null){const row=await env.DB.prepare('SELECT * FROM game_sessions WHERE id=? AND player_id=? AND game_type=? AND result IS NULL').bind(id,userId,'RPG_BATTLE').first();if(!row)return{ok:false,error:'BATTLE_ENDED'};const battle=decodeBattle(row.state);if(!battle||battle.status!=='ACTIVE')return{ok:false,error:'BATTLE_ENDED'};const r=action==='attack'?playerAttack(battle):action==='defend'?playerDefend(battle):action==='run'?playerRun(battle):action==='skill'?useSkill(battle,skill):{ok:false,error:'UNKNOWN_ACTION',battle};if(r?.ok===false)return r;await env.DB.prepare('UPDATE game_sessions SET state=?,result=?,reward_applied=? WHERE id=?').bind(JSON.stringify(r),r.status==='ACTIVE'?null:JSON.stringify({status:r.status}),r.status==='ACTIVE'?0:1,id).run();return{ok:true,battle:r};}
export const rpgKeyboardFor=(battle,id)=>battle.status==='ACTIVE'?battleMenu(id):null;
export const rpgSkillKeyboard=id=>skillMenu(id);
export const rpgMessage=battle=>battleText(battle);
