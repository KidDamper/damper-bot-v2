const now=()=>Math.floor(Date.now()/1000);
const rank={PLAYER:0,MODERATOR:1,ADMIN:2,OWNER:3};
export function canModerate(actor,target,action){if(!actor)return false;if(actor.id===target?.id)return false;return rank[actor.role||'PLAYER']>rank[target?.role||'PLAYER']&&['warn','silence','remove','lock','unlock'].includes(action);}
export async function logAction(env,{groupId,actorId,targetId,action,reason=null,duration=0}){await env.DB.prepare('INSERT INTO moderation_actions(group_id,actor_id,target_id,action,reason,duration,created_at) VALUES(?,?,?,?,?,?,?)').bind(String(groupId),actorId,targetId,action,reason,duration,now()).run();return {ok:true};}
export async function warn(env,groupId,actor,target,reason=null){if(!canModerate(actor,target,'warn'))return {ok:false,error:'PERMISSION'};return logAction(env,{groupId,actorId:actor.id,targetId:target.id,action:'WARN',reason});}
export async function silence(env,groupId,actor,target,duration=300,reason=null){if(!canModerate(actor,target,'silence'))return {ok:false,error:'PERMISSION'};return logAction(env,{groupId,actorId:actor.id,targetId:target.id,action:'SILENCE',reason,duration});}
