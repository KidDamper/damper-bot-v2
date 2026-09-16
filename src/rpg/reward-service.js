import { victoryReward, defeatReward, escapedReward } from './rewards.js';
import { rollLoot, grantLoot } from './loot.js';
import { addRpgXp } from './progression.js';

export async function settleRpgBattle(env,userId,battle){
  const status=battle?.status;
  const reward=status==='WON'?victoryReward(battle.enemy):status==='LOST'?defeatReward():escapedReward();
  if(reward.coins>0)await env.DB.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=?').bind(reward.coins,userId).run();
  await addRpgXp(env,userId,reward.xp);
  let loot=null;
  if(status==='WON')loot=await grantLoot(env,userId,rollLoot(battle.enemy));
  return {status,reward,loot};
}
