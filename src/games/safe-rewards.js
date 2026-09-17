export const SAFE_GAME_REWARDS={
  brain:{easy:{coins:100,xp:5},medium:{coins:150,xp:10},hard:{coins:250,xp:15},wrong:{coins:0,xp:2}},
  reaction:{fastest:{first:{coins:200,xp:15},second:{coins:125,xp:10},third:{coins:75,xp:7},participant:{coins:0,xp:3}},type:{perfect:{coins:150,xp:10},complete:{coins:75,xp:6},fail:{coins:0,xp:2}},reaction:{under250:{coins:200,xp:15},under350:{coins:150,xp:12},under500:{coins:100,xp:8},over500:{coins:50,xp:5},falseStart:{coins:0,xp:2}}}
};

export function safeReward(game,tier){return SAFE_GAME_REWARDS[game]?.[tier]??null;}
