const KEY_PREFIX='safe_game:';

export function safeGameKey(chatId,game){
  return `${KEY_PREFIX}${String(chatId)}:${String(game)}`;
}

export function createSafeState(game,extra={}){
  return {game:String(game),createdAt:Date.now(),updatedAt:Date.now(),...extra};
}

export function updateSafeState(state,patch={}){
  if(!state)return null;
  return {...state,...patch,updatedAt:Date.now()};
}

export function clearSafeState(){
  return null;
}

export function safeStateExpired(state,maxAgeMs=10*60*1000,now=Date.now()){
  return !state||Number(now)-Number(state.updatedAt||state.createdAt||0)>maxAgeMs;
}

export function safeGameSummary(state){
  if(!state)return 'No active safe game.';
  return `🎮 ${state.game} · active`;
}
