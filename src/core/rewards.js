export function gameReward({stake=0,multiplier=0,won=false,difficulty=null}){let payout=Math.floor(stake*multiplier);let xp=won?10:2;if(difficulty==='EASY')xp=won?5:2;if(difficulty==='MEDIUM')xp=won?10:2;if(difficulty==='HARD')xp=won?15:2;return {payout,xp};}
export function penaltyReward(outcome){return outcome==='GOAL'?15:2;}
export function multiplayerPenaltyReward(won){return won?{coins:300,xp:15}:{coins:100,xp:5};}
