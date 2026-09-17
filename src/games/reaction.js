export const REACTION={
 fastest:{first:{coins:200,xp:15},second:{coins:125,xp:10},third:{coins:75,xp:7},participant:{coins:0,xp:3}},
 type:{perfect:{coins:150,xp:10},complete:{coins:75,xp:6},fail:{coins:0,xp:2}},
 reaction:{under250:{coins:200,xp:15},under350:{coins:150,xp:12},under500:{coins:100,xp:8},over500:{coins:50,xp:5},falseStart:{coins:0,xp:2}}
};

export function reactionTier(ms){const n=Number(ms);if(!Number.isFinite(n)||n<0)return null;if(n<250)return 'under250';if(n<=350)return 'under350';if(n<=500)return 'under500';return 'over500';}
export function reactionReward(ms,falseStart=false){if(falseStart)return REACTION.reaction.falseStart;const tier=reactionTier(ms);return REACTION.reaction[tier];}
export function fastestReward(position){return REACTION.fastest[['first','second','third'][Number(position)-1]||'participant'];}
export function typeReward({perfect=false,completed=false}){return perfect?REACTION.type.perfect:completed?REACTION.type.complete:REACTION.type.fail;}

// Reaction Test uses a randomized wait before GO so players cannot predict the start.
export function reactionDelay(min=1200,max=3500){
  const lo=Math.max(0,Math.floor(Number(min)||0));
  const hi=Math.max(lo,Math.floor(Number(max)||lo));
  return lo+Math.floor(Math.random()*(hi-lo+1));
}

export function reactionStart(now=Date.now(),min=1200,max=3500){
  const delay=reactionDelay(min,max);
  return {delay,goAt:Number(now)+delay};
}
