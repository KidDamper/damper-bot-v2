import { reactionStart, reactionReward, fastestStart, fastestGo, fastestTap, fastestReward, typeReward } from './reaction.js';

export function startReactionTest(now=Date.now()){
  const round=reactionStart(now);
  return {phase:'WAITING',startedAt:Number(now),goAt:round.goAt,delay:round.delay};
}

export function resolveReactionTest(start,now=Date.now(),falseStart=false){
  if(falseStart)return {ok:true,falseStart:true,reward:reactionReward(0,true)};
  if(!start?.goAt)return {ok:false,error:'NOT_STARTED'};
  const ms=Math.max(0,Number(now)-Number(start.goAt));
  return {ok:true,ms,reward:reactionReward(ms,false)};
}

export function startFastest(now=Date.now()){return fastestStart(now);}
export function triggerFastest(state,now=Date.now()){return fastestGo(state,now);}
export function tapFastest(state,userId,now=Date.now()){
  const result=fastestTap(state,userId,now);
  if(!result.ok)return result;
  return {...result,reward:result.position?fastestReward(result.position):reactionReward(0,true)};
}

export function resolveTypeChallenge({perfect=false,completed=false}={}){
  return typeReward({perfect,completed});
}
