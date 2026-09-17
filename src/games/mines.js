const MULTIPLIERS={1:1.15,2:1.35,3:1.65,4:2.05,5:2.6,6:3.4,7:4.5,8:6,9:8};

export function newMinesGame(){
  const mines=new Set();
  while(mines.size<3)mines.add(Math.floor(Math.random()*12));
  return {mines:[...mines],opened:[],safe:0,active:true};
}

export function openMine(state,tile){
  const n=Number(tile);
  if(!state?.active||!Number.isInteger(n)||n<0||n>11||state.opened.includes(n))return {ok:false,error:'INVALID_TILE',state};
  if(state.mines.includes(n))return {ok:true,mine:true,state:{...state,active:false}};
  const opened=[...state.opened,n],safe=opened.length;
  if(safe>=9)return {ok:true,mine:false,complete:true,state:{...state,opened,safe,active:false}};
  return {ok:true,mine:false,complete:false,state:{...state,opened,safe}};
}

export function cashout(state){
  if(!state?.active||state.safe<1)return {ok:false,error:'NOTHING_TO_CASHOUT',state};
  return {ok:true,state:{...state,active:false},safe:state.safe};
}

export function minesMultiplier(safe){
  const n=Number(safe);
  return Number.isInteger(n)&&n>=1&&n<=9?MULTIPLIERS[n]:0;
}
