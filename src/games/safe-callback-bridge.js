import { isSafeGameCallback, safeGameRoute, runSafeGameAction } from './safe-router.js';
import { createSafeState, updateSafeState, safeStateExpired } from './safe-game-state.js';

export function handleSafeCallback(data,{state=null,userId=null,now=Date.now(),players=[]}={}){
  if(!isSafeGameCallback(data))return {handled:false};
  const route=safeGameRoute(data);
  if(!route)return {handled:true,ok:false,error:'UNKNOWN_SAFE_CALLBACK'};

  if(route.type==='MENU')return {handled:true,ok:true,route,view:route.view,state};

  if(route.type==='REACTION_TEST_START'){
    const result=runSafeGameAction(route,{now});
    return {handled:true,ok:true,route,state:createSafeState('REACTION_TEST',result),result};
  }

  if(route.type==='FASTEST_START'){
    const result=runSafeGameAction(route,{now});
    return {handled:true,ok:true,route,state:createSafeState('FASTEST',result),result};
  }

  if(route.type==='REACTION_GO'){
    if(safeStateExpired(state))return {handled:true,ok:false,error:'GAME_EXPIRED'};
    const result=runSafeGameAction({type:'FASTEST_GO'},{state,now});
    return {handled:true,ok:!!result?.ok,route,state:result?.state?updateSafeState(state,result.state):state,result};
  }

  if(route.type==='REACTION_TAP'){
    if(safeStateExpired(state))return {handled:true,ok:false,error:'GAME_EXPIRED'};
    const result=runSafeGameAction({type:'FASTEST_TAP'},{state,userId,now});
    return {handled:true,ok:!!result?.ok,route,state:result?.state?updateSafeState(state,result.state):state,result};
  }

  if(route.type==='SOCIAL_PROMPT'){
    const result=runSafeGameAction(route,{players});
    return {handled:true,ok:!!result,route,result};
  }

  if(route.type==='TYPE_CHALLENGE'){
    const result=runSafeGameAction(route,{now});
    return {handled:true,ok:!!result,route,result};
  }

  if(route.type==='REACTION_TEST_RESOLVE'){
    if(safeStateExpired(state))return {handled:true,ok:false,error:'GAME_EXPIRED'};
    const result=runSafeGameAction(route,{state,now});
    return {handled:true,ok:!!result?.ok,route,result};
  }

  return {handled:true,ok:false,error:'UNSUPPORTED_SAFE_ACTION',route};
}

export function safeCallbackResult(data,options={}){
  const result=handleSafeCallback(data,options);
  return result.handled?result:null;
}
