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
export async function expireSessions(env){
  return env.DB.prepare("UPDATE game_sessions SET result='EXPIRED' WHERE reward_applied=0 AND expires_at<? AND result IS NULL").bind(now()).run();
}
export function sessionId(type){return `${type.toLowerCase()}_${crypto.randomUUID().replaceAll('-','').slice(0,12)}`;}
