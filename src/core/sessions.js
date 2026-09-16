const now=()=>Math.floor(Date.now()/1000);
export async function createSession(env,{id,type,chatId,playerIds=[],state={},stake=0,ttl=900}){
  const expires=now()+ttl;
  await env.DB.prepare(`INSERT INTO game_sessions(id,game_type,chat_id,player_ids,state,turn,stake,started_at,expires_at,result,rewarded) VALUES(?,?,?,?,?,?,?,?,?,?,0)`).bind(id,type,String(chatId),JSON.stringify(playerIds),JSON.stringify(state),0,stake,now(),expires,null).run();
  return id;
}
export async function getSession(env,id){return env.DB.prepare('SELECT * FROM game_sessions WHERE id=?').bind(id).first();}
export async function updateSession(env,id,patch){const s=await getSession(env,id);if(!s)return null;const state=patch.state??JSON.parse(s.state||'{}');await env.DB.prepare(`UPDATE game_sessions SET state=?,turn=?,result=COALESCE(?,result),expires_at=? WHERE id=?`).bind(JSON.stringify(state),patch.turn??s.turn,patch.result??null,patch.expires_at??s.expires_at,id).run();return getSession(env,id);}
export async function finishSession(env,id,result){const s=await getSession(env,id);if(!s||s.rewarded)return false;await env.DB.prepare('UPDATE game_sessions SET result=?,rewarded=1 WHERE id=? AND rewarded=0').bind(JSON.stringify(result),id).run();return true;}
export async function expireSessions(env){await env.DB.prepare("UPDATE game_sessions SET result='EXPIRED' WHERE rewarded=0 AND expires_at<?").bind(now()).run();}
export function sessionId(type){return `${type.toLowerCase()}_${crypto.randomUUID().replaceAll('-','').slice(0,12)}`;}
