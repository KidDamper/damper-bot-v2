const LEVELS={OWNER:4,ADMIN:3,MODERATOR:2,PLAYER:1};
const now=()=>Math.floor(Date.now()/1000);

export function canModerate(actor,target){
  if(!actor||!target)return false;
  return (LEVELS[actor.role]||0)>(LEVELS[target.role]||0);
}

export async function logModeration(env,{actorId,targetId,chatId,action,reason=''}){
  await env.DB.prepare(`INSERT INTO moderation_actions(actor_id,target_id,chat_id,action,reason,created_at) VALUES(?,?,?,?,?,?)`)
    .bind(actorId,targetId,String(chatId),action,String(reason||''),now()).run();
}

export async function warn(env,{actor,target,chatId,reason=''}){
  if(!canModerate(actor,target))return {ok:false,error:'INSUFFICIENT_ROLE'};
  await logModeration(env,{actorId:actor.id,targetId:target.id,chatId,action:'WARN',reason});
  return {ok:true};
}

export async function moderationHistory(env,targetId,limit=20){
  const r=await env.DB.prepare(`SELECT action,reason,created_at FROM moderation_actions WHERE target_id=? ORDER BY created_at DESC LIMIT ?`)
    .bind(targetId,Math.max(1,Math.min(100,Number(limit)||20))).all();
  return r.results||[];
}
