import { diceDuel, penalty, slots, race } from '../core/games.js';
import { WAGER_RULES, validateStake, penaltyMultiplier } from '../core/game-rules.js';

const stakeButtons=(game,icon)=>[
  [{text:`${icon} 50`,callback_data:`stake:${game}:50`},{text:`${icon} 100`,callback_data:`stake:${game}:100`}],
  [{text:`${icon} 250`,callback_data:`stake:${game}:250`},{text:'✏️ CUSTOM',callback_data:`stake_custom:${game}`}]
];

export const gameButtons={
  dice:stakeButtons('dice','🎲'),
  slots:stakeButtons('slots','🎰'),
  penalty:stakeButtons('penalty','⚽'),
  mines:stakeButtons('mines','💣'),
  race:stakeButtons('race','🏁')
};

export function penaltyChoices(stake){return [
  [{text:'⬅️ LEFT',callback_data:`penalty:${stake}:left`},{text:'🎯 CENTER',callback_data:`penalty:${stake}:center`}],
  [{text:'➡️ RIGHT',callback_data:`penalty:${stake}:right`}],
  [{text:'↖️ TOP LEFT',callback_data:`penalty:${stake}:top-left`},{text:'↗️ TOP RIGHT',callback_data:`penalty:${stake}:top-right`}]
];}

export function resolveWager(type,stake,choice='left'){
  const s=Number(stake);
  if(!validateStake(s,Number.MAX_SAFE_INTEGER)) return {ok:false,error:'INVALID_STAKE'};
  if(type==='dice'){
    const r=diceDuel();
    const mult=r.outcome==='WIN'?WAGER_RULES.DICE_DUEL.multipliers.WIN:r.outcome==='DRAW'?WAGER_RULES.DICE_DUEL.multipliers.DRAW:0;
    return {ok:true,outcome:r.outcome,mult,xp:r.outcome==='WIN'?10:r.outcome==='DRAW'?4:2,text:`🎲 *DICE DUEL*\n\nYou: ${r.a}\nBot: ${r.b}\n\n${r.outcome==='WIN'?'You win.':r.outcome==='DRAW'?'Draw — stake returned.':'You lose.'}`};
  }
  if(type==='slots'){
    const r=slots(),mult=WAGER_RULES.SLOTS.multipliers[r.kind]||0;
    return {ok:true,outcome:mult>0?'WIN':'LOSS',mult,xp:mult>0?10:2,text:`🎰 *SLOTS*\n\n${r.roll.join(' | ')}\nResult: ${r.kind}`};
  }
  if(type==='penalty'){
    const r=penalty(choice),mult=r.outcome==='GOAL'?penaltyMultiplier(choice):0;
    return {ok:true,outcome:r.outcome==='GOAL'?'WIN':'LOSS',mult,xp:r.outcome==='GOAL'?15:2,text:`⚽ *PENALTY*\n\nShot: ${choice}\nKeeper: ${r.keeper}\n\n${r.outcome==='GOAL'?'🥅 GOAL!':'🧤 SAVED!'}`};
  }
  if(type==='race'){
    const r=race(),pos=r.findIndex(x=>x.player===1)+1;
    const mult=pos===1?3:pos===2?1.5:pos===3?.75:0;
    return {ok:true,outcome:mult>0?'WIN':'LOSS',mult,xp:mult>0?10:2,text:`🏁 *VIRTUAL RACE*\n\nYou finished ${pos}${pos===1?'st':pos===2?'nd':pos===3?'rd':'th'}.`};
  }
  return {ok:false,error:'UNKNOWN_GAME'};
}
