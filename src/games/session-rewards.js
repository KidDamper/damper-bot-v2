import { brainReward } from './brain-service.js';
import { reactionReward } from './reaction.js';

export function brainSessionReward(question,correct){return brainReward(question,correct);}
export function reactionSessionReward(ms,falseStart=false){return reactionReward(ms,falseStart);}

export function sessionResult(type,{won=false,difficulty=null,ms=null,falseStart=false}={}){
  if(type==='BRAIN')return brainSessionReward({d:difficulty||'EASY'},won);
  if(type==='REACTION_TEST')return reactionSessionReward(ms,falseStart);
  return won?{coins:100,xp:10}:{coins:0,xp:2};
}
