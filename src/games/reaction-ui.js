import { startReactionTest, resolveReactionTest, startFastest, triggerFastest, tapFastest, resolveTypeChallenge } from './reaction-service.js';

export const REACTION_CALLBACKS={fastest:'reaction_fastest',type:'reaction_type',test:'reaction_test'};

export function reactionMenu(){
  return {text:'⚡ *REACTION GAMES*\n\nTest speed, timing and accuracy — no wager required.',reply_markup:{inline_keyboard:[
    [{text:'⚡ FASTEST',callback_data:REACTION_CALLBACKS.fastest}],
    [{text:'⌨️ TYPE CHALLENGE',callback_data:REACTION_CALLBACKS.type}],
    [{text:'⚡ REACTION TEST',callback_data:REACTION_CALLBACKS.test}],
    [{text:'⬅️ BACK',callback_data:'menu_games'}]
  ]}};
}

export { startReactionTest, resolveReactionTest, startFastest, triggerFastest, tapFastest, resolveTypeChallenge };
