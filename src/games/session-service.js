import { sessionId, createSession, getSession, updateSession, finishSession } from '../core/sessions.js';
import { debit, credit } from '../core/wallet.js';

const now=()=>Math.floor(Date.now()/1000);

export async function startWagerSession(env,{userId,chatId,type,stake,state={}}){
  const id=sessionId(type);
  if(!Number.isInteger(stake)||stake<50) return {ok:false,error:'INVALID_STAKE'};
  const existing=await env.DB.prepare("SELECT id FROM game_sessions WHERE player_id=? AND result IS NULL AND expires_at>? LIMIT 1").bind(userId,now()).first();
  if(existing) return {ok:false,error:'ACTIVE_SESSION'};
  try { await debit(env,userId,stake); } catch(e) { if(e?.message==='INSUFFICIENT_BALANCE') return {ok:false,error:'INSUFFICIENT_BALANCE'}; throw e; }
  try { await createSession(env,{id,type,chatId,playerId:userId,state,stake}); }
  catch(e){ await credit(env,userId,stake); throw e; }
  return {ok:true,id,stake};
}

export async function resolveWagerSession(env,id,{outcome,payout=0,xp=0,state=null}){
  const s=await getSession(env,id);
  if(!s || s.result==='EXPIRED' || s.reward_applied) return {ok:false,error:'SESSION_CLOSED'};
  await getSession(env,id);
  const claim=env.DB.prepare('UPDATE game_sessions SET result=?,reward_applied=1 WHERE id=? AND reward_applied=0').bind(JSON.stringify({outcome,payout,xp,finished_at:now()}),id);
  const wallet=env.DB.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=?').bind(Math.max(0,Math.floor(payout)),s.player_id);
  const results=payout>0?await env.DB.batch([claim,wallet]):await env.DB.batch([claim]);
  if(Number(results?.[0]?.meta?.changes??0)!==1) return {ok:false,error:'ALREADY_RESOLVED'};
  if(payout>0&&Number(results?.[1]?.meta?.changes??0)!==1) throw Error('WALLET_CREDIT_FAILED');
  if(state) await updateSession(env,id,{state});
  return {ok:true,session:s};
}

export async function continueSession(env,id,state){
  const s=await getSession(env,id);
  if(!s || s.reward_applied || s.expires_at<=now()) return null;
  return updateSession(env,id,{state});
}
