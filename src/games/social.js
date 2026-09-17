const TRUTH=[
  'What is a skill you would like to master?',
  'What is the funniest thing that happened to you recently?',
  'What is one food you could eat every week?',
  'What is a goal you are currently working toward?',
  'What game do you never get tired of?'
];

const DARE=[
  'Send the group your best victory emoji combo.',
  'Describe your day using exactly three words.',
  'Type a sentence using only emojis.',
  'Compliment the player who joined before you.',
  'Invent a ridiculous superhero name for yourself.'
];

const unique=(players=[])=>[...new Set((players||[]).map(String).filter(Boolean))];
const boundedRandom=(random=Math.random)=>Math.max(0,Math.min(0.999999,Number(random())||0));

export function truthOrDare(type='random',random=Math.random){
  const mode=String(type||'random').toLowerCase();
  const pick=(items)=>items[Math.floor(boundedRandom(random)*items.length)];
  if(mode==='truth')return {type:'TRUTH',prompt:pick(TRUTH)};
  if(mode==='dare')return {type:'DARE',prompt:pick(DARE)};
  return boundedRandom(random)<0.5?{type:'TRUTH',prompt:pick(TRUTH)}:{type:'DARE',prompt:pick(DARE)};
}

export function hotSeat(players=[],round=1){
  const list=unique(players);
  if(!list.length)return {ok:false,error:'NO_PLAYERS'};
  const r=Math.max(1,Number(round)||1);
  return {ok:true,playerId:list[(r-1)%list.length],round:r,players:list};
}

export function impostorRound(players=[],random=Math.random){
  const list=unique(players);
  if(list.length<3)return {ok:false,error:'NEED_THREE_PLAYERS'};
  return {ok:true,players:list,impostor:list[Math.floor(boundedRandom(random)*list.length)],clueRequired:true};
}

export function socialStart(type,players=[]){
  const list=unique(players),game=String(type||'').toUpperCase();
  if(game==='TRUTH_DARE'||game==='HOT_SEAT')return list.length>=2?{ok:true,type:game,players:list,turn:0}:{ok:false,error:'NEED_TWO_PLAYERS'};
  if(game==='IMPOSTOR')return list.length>=3?{ok:true,type:game,players:list,impostor:null,revealed:false}:{ok:false,error:'NEED_THREE_PLAYERS'};
  return {ok:false,error:'UNKNOWN_GAME'};
}

export function nextSocialTurn(state){
  if(!state?.players?.length)return state;
  return {...state,turn:(Number(state.turn||0)+1)%state.players.length};
}

export function socialHelp(){
  return '🎭 *SOCIAL GAMES*\n\n🎯 Truth or Dare — pick truth, dare, or random.\n🔥 Hot Seat — rotate the spotlight through the group.\n🕵️ Impostor — one hidden impostor, minimum 3 players.';
}
