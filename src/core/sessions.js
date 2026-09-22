const now=()=>Math.floor(Date.now()/1000);
export async function createSession(env,{id,type,chatId,playerId,state={},stake=0,ttl=900}){
  const expires=now()+ttl;
  await env.DB.prepare(`INSERT INTO game_sessions(id,game_type,chat_id,player_id,state,stake,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)`).bind(id,type,String(chatId),playerId,JSON.stringify(state),stake,expires,now()).run();
  return id;
}
export async function getSession(env,id){return env.DB.prepare('SELECT * FROM game_sessions WHERE id=?').bind(id).first();}
export async function updateSession(env,id,patch){
  const s=await getSession(env,id); if(!s)return null;
  const state=patch.state??JSON.parse(s.state||'{}');
  await env.DB.prepare(`UPDATE game_sessions SET state=?,result=COALESCE(?,result),expires_at=? WHERE id=?`).bind(JSON.stringify(state),patch.result??null,patch.expires_at??s.expires_at,id).run();
  return getSession(env,id);
}
export async function finishSession(env,id,result){
  const s=await getSession(env,id); if(!s || s.reward_applied)return false;
  const r=await env.DB.prepare('UPDATE game_sessions SET result=?,reward_applied=1 WHERE id=? AND reward_applied=0').bind(JSON.stringify(result),id).run();
  return !!r.meta?.changes;
}
export async function cancelSession(env,id,playerId){
  const s=await env.DB.prepare('SELECT player_id,stake FROM game_sessions WHERE id=? AND result IS NULL AND reward_applied=0').bind(id).first();
  if(!s||String(s.player_id)!==String(playerId))return {ok:false,error:'SESSION_NOT_ACTIVE'};
  const claim=await env.DB.prepare("UPDATE game_sessions SET result='CANCELLED',reward_applied=1 WHERE id=? AND player_id=? AND reward_applied=0 AND result IS NULL").bind(id,playerId).run();
  if(!claim.meta?.changes)return {ok:false,error:'SESSION_ALREADY_RESOLVED'};
  const stake=Number(s.stake)||0;
  if(stake>0){const refund=await env.DB.batch([env.DB.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=?').bind(stake,playerId)]);if(Number(refund?.[0]?.meta?.changes??0)!==1)throw Error('WALLET_REFUND_FAILED');}
  return {ok:true,refunded:stake};
}
export async function expireSessions(env){
  const rows=await env.DB.prepare('SELECT id,player_id,stake FROM game_sessions WHERE reward_applied=0 AND expires_at<? AND result IS NULL').bind(now()).all();
  let expired=0;
  for(const s of rows.results||[]){
    const claim=await env.DB.prepare("UPDATE game_sessions SET result='EXPIRED',reward_applied=1 WHERE id=? AND reward_applied=0 AND result IS NULL").bind(s.id).run();
    if(!claim.meta?.changes)continue;
    if(Number(s.stake)>0){const refund=await env.DB.batch([env.DB.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=?').bind(Number(s.stake),s.player_id)]);if(Number(refund?.[0]?.meta?.changes??0)!==1)throw Error('WALLET_REFUND_FAILED');}
    expired++;
  }
  return {expired};
}
export function sessionId(type){return `${type.toLowerCase()}_${crypto.randomUUID().replaceAll('-','').slice(0,12)}`;}
