import { socialMenu, socialPrompt } from './social-ui.js';
import { reactionMenu, startReactionTest, resolveReactionTest, startFastest, triggerFastest, tapFastest } from './reaction-ui.js';

const SAFE={
  social:['social_main','social_truth','social_dare','social_random','social_hotseat','social_impostor'],
  reaction:['game_reaction','reaction_main','reaction_fastest','reaction_type','reaction_test','reaction_go']
};

export function isSafeGameCallback(data=''){
  const d=String(data);
  return SAFE.social.some(x=>d===x)||SAFE.reaction.some(x=>d===x)||d.startsWith('reaction_go:')||d.startsWith('reaction_tap:');
}

export function safeGameRoute(data=''){
  const d=String(data);
  if(d==='social_main')return {type:'MENU',view:socialMenu()};
  if(d==='reaction_main'||d==='game_reaction')return {type:'MENU',view:reactionMenu()};
  if(d==='social_truth'||d==='social_dare'||d==='social_random')return {type:'SOCIAL_PROMPT',action:d.slice(7)};
  if(d==='social_hotseat')return {type:'SOCIAL_PROMPT',action:'hotseat'};
  if(d==='social_impostor')return {type:'SOCIAL_PROMPT',action:'impostor'};
  if(d==='reaction_test')return {type:'REACTION_TEST_START'};
  if(d==='reaction_fastest')return {type:'FASTEST_START'};
  if(d==='reaction_type')return {type:'TYPE_CHALLENGE'};
  if(d.startsWith('reaction_go:'))return {type:'REACTION_GO',id:d.slice(13)};
  if(d.startsWith('reaction_tap:'))return {type:'REACTION_TAP',id:d.slice(14)};
  return null;
}

export function runSafeGameAction(route,{state=null,userId=null,now=Date.now(),players=[]}={}){
  if(!route)return null;
  if(route.type==='SOCIAL_PROMPT')return socialPrompt(route.action,players);
  if(route.type==='REACTION_TEST_START')return startReactionTest(now);
  if(route.type==='REACTION_TEST_RESOLVE')return resolveReactionTest(state,now,false);
  if(route.type==='FASTEST_START')return startFastest(now);
  if(route.type==='FASTEST_GO')return triggerFastest(state,now);
  if(route.type==='FASTEST_TAP')return tapFastest(state,userId,now);
  return null;
}

export function reactionGoRoute(id){return {type:'REACTION_GO',id:String(id)};}
export function reactionTapRoute(id){return {type:'REACTION_TAP',id:String(id)};}
