import { diceDuel, penalty, slots, minesBoard, race } from '../core/games.js';
import { WAGER_RULES, validateStake } from '../core/game-rules.js';

export const gameButtons = {
  dice: [[{text:'🎲 50',callback_data:'stake:dice:50'},{text:'🎲 100',callback_data:'stake:dice:100'}],[{text:'🎲 250',callback_data:'stake:dice:250'}]],
  slots: [[{text:'🎰 50',callback_data:'stake:slots:50'},{text:'🎰 100',callback_data:'stake:slots:100'}],[{text:'🎰 250',callback_data:'stake:slots:250'}]],
  penalty: [[{text:'⚽ 50',callback_data:'stake:penalty:50'},{text:'⚽ 100',callback_data:'stake:penalty:100'}],[{text:'⚽ 250',callback_data:'stake:penalty:250'}]],
  mines: [[{text:'💣 50',callback_data:'stake:mines:50'},{text:'💣 100',callback_data:'stake:mines:100'}],[{text:'💣 250',callback_data:'stake:mines:250'}]],
  race: [[{text:'🏁 50',callback_data:'stake:race:50'},{text:'🏁 100',callback_data:'stake:race:100'}],[{text:'🏁 250',callback_data:'stake:250'}]]
};

export function resolveWager(type,stake,choice='left'){
  const s=Number(stake);
  if(!validateStake(s,Number.MAX_SAFE_INTEGER)) return {ok:false,error:'INVALID_STAKE'};
  if(type==='dice'){
    const r=diceDuel(), mult=r.outcome==='WIN'?WAGER_RULES.DICE_DUEL.multipliers.WIN:r.outcome==='DRAW'?1:0;
    return {ok:true,outcome:r.outcome,mult,xp:r.outcome==='WIN'?10:2,text:`🎲 You rolled ${r.a} — opponent rolled ${r.b}. ${r.outcome==='WIN'?'You win!':r.outcome==='DRAW'?'Draw.':'You lose.'}`};
  }
  if(type==='slots'){
    const r=slots(),mult=WAGER_RULES.SLOTS.multipliers[r.kind]||0;
    return {ok:true,outcome:mult>0?'WIN':'LOSS',mult,xp:mult>0?10:2,text:`🎰 ${r.roll.join(' | ')}\nResult: ${r.kind}`};
  }
  if(type==='penalty'){
    const r=penalty(choice),mult=r.outcome==='GOAL'?(WAGER_RULES.PENALTY.multipliers[choice.toUpperCase()]||0):0;
    return {ok:true,outcome:r.outcome==='GOAL'?'WIN':'LOSS',mult,xp:r.outcome==='GOAL'?15:2,text:`⚽ You shot ${choice}. Keeper went ${r.keeper}. ${r.outcome==='GOAL'?'GOAL!':'SAVED!'}`};
  }
  if(type==='race'){
    const r=race(),pos=r.findIndex(x=>x.player===1)+1,mult=pos===1?3:pos===2?1.5:pos===3?.75:0;
    return {ok:true,outcome:mult>0?'WIN':'LOSS',mult,xp:mult>0?10:2,text:`🏁 You finished ${pos}${pos===1?'st':pos===2?'nd':pos===3?'rd':'th'} in the race.`};
  }
  if(type==='mines'){
    const mines=minesBoard(); return {ok:true,outcome:'PENDING',mult:1,xp:2,text:`💣 Mines ready. Hidden mines: ${mines.length}. Choose tiles to continue.`};
  }
  return {ok:false,error:'UNKNOWN_GAME'};
}
