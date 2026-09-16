const XP_BY_TIER={EASY:25,MEDIUM:50,HARD:90,ELITE:150,BOSS:300};
const COINS_BY_TIER={EASY:100,MEDIUM:250,HARD:500,ELITE:1000,BOSS:2500};
export function victoryReward(enemy){const tier=enemy?.tier||'EASY';return {coins:COINS_BY_TIER[tier]??100,xp:XP_BY_TIER[tier]??25};}
export function defeatReward(){return {coins:0,xp:10};}
export function escapedReward(){return {coins:0,xp:3};}
export function levelUpStats(level){const l=Math.max(1,Math.min(50,Number(level)||1));return {hp:100+5*(l-1),atk:20+(l-1),def:10+Math.floor((l-1)/2),energy:50+2*(l-1),speed:10+Math.floor((l-1)/5)};}
