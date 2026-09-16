export const WAGER_RULES={
  DICE_DUEL:{min:50,multipliers:{WIN:1.8,DRAW:1,LOSS:0}},
  MINES:{min:50,multipliers:{1:1.15,2:1.35,3:1.65,4:2.05,5:2.6,6:3.4,7:4.5,8:6,9:8,0:0}},
  SLOTS:{min:50,multipliers:{NONE:0,TWO:1.25,THREE:3,SPECIAL:7,JACKPOT:15}},
  PENALTY:{min:50,multipliers:{CENTER:1.4,SIDE:2,TOP:3,SAVE:0}},
  RACE:{min:50,multipliers:{FIRST:3,SECOND:1.5,THIRD:0.75,OTHER:0}}
};
export function validateStake(stake,balance){return Number.isInteger(stake)&&stake>=50&&stake<=balance;}
export function minesMultiplier(safe){return WAGER_RULES.MINES.multipliers[safe]??0;}
export function penaltyMultiplier(direction){if(direction==='center')return 1.4;if(direction==='left'||direction==='right')return 2;if(direction==='top-left'||direction==='top-right')return 3;return 0;}
