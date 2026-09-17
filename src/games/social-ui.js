import { truthOrDare, hotSeat, impostorRound, socialHelp } from './social.js';

export const SOCIAL_CALLBACKS={truth:'social_truth',dare:'social_dare',random:'social_random',hotSeat:'social_hotseat',impostor:'social_impostor'};

export function socialMenu(){
  return {text:socialHelp(),reply_markup:{inline_keyboard:[
    [{text:'🎯 TRUTH',callback_data:SOCIAL_CALLBACKS.truth},{text:'🔥 DARE',callback_data:SOCIAL_CALLBACKS.dare}],
    [{text:'🎲 RANDOM',callback_data:SOCIAL_CALLBACKS.random}],
    [{text:'🔥 HOT SEAT',callback_data:SOCIAL_CALLBACKS.hotSeat}],
    [{text:'🕵️ IMPOSTOR',callback_data:SOCIAL_CALLBACKS.impostor}],
    [{text:'⬅️ BACK',callback_data:'menu_games'}]
  ]}};
}

export function socialPrompt(action,players=[]){
  const key=String(action||'').toLowerCase();
  if(key==='truth'||key==='dare'||key==='random')return truthOrDare(key);
  if(key==='hotseat')return hotSeat(players,1);
  if(key==='impostor')return impostorRound(players);
  return null;
}
