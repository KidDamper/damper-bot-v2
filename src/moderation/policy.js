const LEVEL={OWNER:4,ADMIN:3,MODERATOR:2,PLAYER:1};
const ACTION_MIN={WARN:'MODERATOR',SILENCE:'MODERATOR',REMOVE:'ADMIN',LOCK:'MODERATOR',UNLOCK:'MODERATOR'};

export function roleLevel(role){return LEVEL[String(role||'PLAYER').toUpperCase()]||0;}
export function requiredRole(action){return ACTION_MIN[String(action||'').toUpperCase()]||null;}
export function canPerform(action,actor,target=null){
  const need=requiredRole(action);if(!need)return false;
  const actorLevel=roleLevel(actor?.role),needLevel=roleLevel(need),targetLevel=roleLevel(target?.role);
  if(actorLevel<needLevel)return false;
  if(target && actorLevel<=targetLevel)return false;
  return true;
}
export function moderationActionText(action){
  const a=String(action||'').toUpperCase();
  return ({WARN:'⚠️ Warning issued.',SILENCE:'🔇 Member silenced.',REMOVE:'🚫 Member removed.',LOCK:'🔒 Group locked.',UNLOCK:'🔓 Group unlocked.'})[a]||'Moderation action completed.';
}
