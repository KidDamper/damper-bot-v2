import { sessionId, createSession, getSession, updateSession, finishSession } from '../core/sessions.js';

const now=()=>Math.floor(Date.now()/1000);

export async function startWagerSession(env,{userId,chatId,type,stake,state={}}){
  const id=sessionId(type);
  const u=await env.DB.prepare('SELECT balance FROM wallets WHERE user_id=?').bind(userId).first();
  if(!u || Number(u.balance)<stake) return {ok:false,error:'INSUFFICIENT_BALANCE'};
  if(!Number.isInteger(stake)||stake<50) return {ok:false,error:'INVALID_STAKE'};
  const existing=await env.DB.prepare("SELECT id FROM game_sessions WHERE player_id=? AND result IS NULL AND expires_at>? LIMIT 1").bind(userId,now()).first();
  if(existing) return {ok:false,error:'ACTIVE_SESSION'};
  const deducted=await env.DB.prepare('UPDATE wallets SET balance=balance-? WHERE user_id=? AND balance>=?').bind(stake,userId,stake).run();
  if(!(deducted.meta?.changes)) return {ok:false,error:'STAKE_NOT_LOCKED'};
  try { await createSession(env,{id,type,chatId,playerId:userId,state,stake}); }
  catch(e){ await env.DB.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=?').bind(stake,userId).run(); throw e; }
  return {ok:true,id,stake};
}

export async function resolveWagerSession(env,id,{outcome,payout=0,xp=0,state=null}){
  const s=await getSession(env,id);
  if(!s || s.result==='EXPIRED' || s.reward_applied) return {ok:false,error:'SESSION_CLOSED'};
  const locked=await finishSession(env,id,{outcome,payout,xp,finished_at:now()});
  if(!locked) return {ok:false,error:'ALREADY_RESOLVED'};
  if(payout>0) await env.DB.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=?').bind(Math.floor(payout),s.player_id).run();
  if(state) await updateSession(env,id,{state});
  return {ok:true,session:s};
}

export async function continueSession(env,id,state){
  const s=await getSession(env,id);
  if(!s || s.reward_applied || s.expires_at<=now()) return null;
  return updateSession(env,id,{state});
}
