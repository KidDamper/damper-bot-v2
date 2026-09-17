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

export function truthOrDare(type='random',random=Math.random){
  const mode=String(type||'random').toLowerCase();
  const pick=(items)=>items[Math.floor(Math.max(0,Math.min(0.999999,Number(random())||0))*items.length)];
  if(mode==='truth')return {type:'TRUTH',prompt:pick(TRUTH)};
  if(mode==='dare')return {type:'DARE',prompt:pick(DARE)};
  return random()<0.5?{type:'TRUTH',prompt:pick(TRUTH)}:{type:'DARE',prompt:pick(DARE)};
}

export function hotSeat(players=[],round=1){
  const list=[...new Set((players||[]).map(String).filter(Boolean))];
  if(!list.length)return {ok:false,error:'NO_PLAYERS'};
  const index=(Math.max(1,Number(round)||1)-1)%list.length;
  return {ok:true,playerId:list[index],round:Math.max(1,Number(round)||1),players:list};
}

export function impostorRound(players=[],random=Math.random){
  const list=[...new Set((players||[]).map(String).filter(Boolean))];
  if(list.length<3)return {ok:false,error:'NEED_THREE_PLAYERS'};
  const index=Math.floor(Math.max(0,Math.min(0.999999,Number(random())||0))*list.length);
  const impostor=list[index];
  return {ok:true,players:list,impostor,clueRequired:true};
}

export function socialHelp(){
  return '🎭 *SOCIAL GAMES*\n\n🎯 Truth or Dare — pick truth, dare, or random.\n🔥 Hot Seat — rotate the spotlight through the group.\n🕵️ Impostor — one hidden impostor, minimum 3 players.';
}
