import { BRAIN_BANK } from './brain-bank.js';

export function brainBankStats(){
  const stats={total:BRAIN_BANK.length,byCategory:{},byDifficulty:{easy:0,medium:0,hard:0}};
  for(const item of BRAIN_BANK){
    const category=String(item.category||'OTHER');
    stats.byCategory[category]=(stats.byCategory[category]||0)+1;
    const difficulty=String(item.difficulty||'').toLowerCase();
    if(difficulty in stats.byDifficulty)stats.byDifficulty[difficulty]++;
  }
  return stats;
}
