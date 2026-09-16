const now=()=>Math.floor(Date.now()/1000);

export async function unlockAchievement(env,userId,achievementId){
  const a=await env.DB.prepare('SELECT id,name,description FROM achievements WHERE id=?').bind(achievementId).first();
  if(!a)return {ok:false,error:'ACHIEVEMENT_NOT_FOUND'};
  const exists=await env.DB.prepare('SELECT 1 FROM user_achievements WHERE user_id=? AND achievement_id=?').bind(userId,achievementId).first();
  if(exists)return {ok:false,already:true,achievement:a};
  await env.DB.prepare('INSERT INTO user_achievements(user_id,achievement_id,unlocked_at) VALUES(?,?,?)').bind(userId,achievementId,now()).run();
  return {ok:true,achievement:a};
}

export async function listAchievements(env,userId){
  const r=await env.DB.prepare(`SELECT a.id,a.name,a.description,CASE WHEN ua.user_id IS NULL THEN 0 ELSE 1 END unlocked,ua.unlocked_at FROM achievements a LEFT JOIN user_achievements ua ON ua.achievement_id=a.id AND ua.user_id=? ORDER BY unlocked DESC,a.name`).bind(userId).all();
  return r.results||[];
}

export async function grantTitle(env,userId,titleId){
  const t=await env.DB.prepare('SELECT id,name,description FROM titles WHERE id=?').bind(titleId).first();
  if(!t)return {ok:false,error:'TITLE_NOT_FOUND'};
  await env.DB.prepare('INSERT OR IGNORE INTO user_titles(user_id,title_id,earned_at) VALUES(?,?,?)').bind(userId,titleId,now()).run();
  return {ok:true,title:t};
}
