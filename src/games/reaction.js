export const REACTION={
 fastest:{first:{coins:200,xp:15},second:{coins:125,xp:10},third:{coins:75,xp:7},participant:{coins:0,xp:3}},
 type:{perfect:{coins:150,xp:10},complete:{coins:75,xp:6},fail:{coins:0,xp:2}},
 reaction:{under250:{coins:200,xp:15},under350:{coins:150,xp:12},under500:{coins:100,xp:8},over500:{coins:50,xp:5},falseStart:{coins:0,xp:2}}
};

export function reactionTier(ms){const n=Number(ms);if(!Number.isFinite(n)||n<0)return null;if(n<250)return 'under250';if(n<=350)return 'under350';if(n<=500)return 'under500';return 'over500';}
export function reactionReward(ms,falseStart=false){if(falseStart)return REACTION.reaction.falseStart;const tier=reactionTier(ms);return tier?REACTION.reaction[tier]:null;}
export function fastestReward(position){return REACTION.fastest[['first','second','third'][Number(position)-1]||'participant'];}
export function typeReward({perfect=false,completed=false}={}){return perfect?REACTION.type.perfect:completed?REACTION.type.complete:REACTION.type.fail;}

export function reactionDelay(min=1200,max=3500){
  const lo=Math.max(0,Math.floor(Number(min)||0));
  const hi=Math.max(lo,Math.floor(Number(max)||lo));
  return lo+Math.floor(Math.random()*(hi-lo+1));
}

export function reactionStart(now=Date.now(),min=1200,max=3500){
  const delay=reactionDelay(min,max);
  return {delay,goAt:Number(now)+delay};
}

export function fastestStart(now=Date.now()){return {phase:'WAITING',startedAt:Number(now),goAt:null,players:[],falseStarts:[],finishers:[]};}
export function fastestGo(state,now=Date.now()){if(!state||state.phase!=='WAITING')return {ok:false,error:'INVALID_STATE',state};return {ok:true,state:{...state,phase:'GO',goAt:Number(now)}};}
export function fastestTap(state,userId,now=Date.now()){
  if(!state||!userId)return {ok:false,error:'INVALID_STATE',state};
  const id=String(userId);
  if(state.phase!=='GO'){
    const falseStarts=state.falseStarts?.includes(id)?state.falseStarts:[...(state.falseStarts||[]),id];
    return {ok:true,falseStart:true,state:{...state,falseStarts}};
  }
  if((state.finishers||[]).some(x=>String(x.userId)===id))return {ok:false,error:'ALREADY_FINISHED',state};
  const finishers=[...(state.finishers||[]),{userId:id,ms:Math.max(0,Number(now)-Number(state.goAt))}];
  return {ok:true,position:finishers.length,ms:finishers.at(-1).ms,state:{...state,finishers}};
}
