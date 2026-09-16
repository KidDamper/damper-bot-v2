const now=()=>Math.floor(Date.now()/1000);
export async function getGroup(env,groupId){return env.DB.prepare('SELECT * FROM groups WHERE group_id=?').bind(String(groupId)).first();}
export async function isApproved(env,groupId){const g=await getGroup(env,groupId);return !!(g&&Number(g.approved)===1);}
export async function requestApproval(env,{groupId,groupName,ownerId}){const existing=await getGroup(env,groupId);if(existing)return existing;await env.DB.prepare('INSERT INTO groups(group_id,group_name,owner_id,approved,created_at) VALUES(?,?,?,0,?)').bind(String(groupId),groupName||null,String(ownerId),now()).run();return getGroup(env,groupId);}
export async function setApproval(env,groupId,approved){await env.DB.prepare('UPDATE groups SET approved=?,approved_at=? WHERE group_id=?').bind(approved?1:0,approved?now():null,String(groupId)).run();return getGroup(env,groupId);}
