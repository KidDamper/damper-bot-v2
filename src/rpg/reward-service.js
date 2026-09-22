import { victoryReward, defeatReward, escapedReward } from './rewards.js';
import { rollLoot, grantLoot } from './loot.js';
import { addRpgXp } from './progression.js';
import { credit } from '../core/wallet.js';

export async function settleRpgBattle(env,userId,battle){
  const status=battle?.status;
  const battleId=battle?.id||battle?.battleId;
  if(battleId){
    const claim=await env.DB.prepare(`UPDATE rpg_battles SET reward_applied=1 WHERE id=? AND user_id=? AND reward_applied=0`).bind(String(battleId),userId).run();
    if(!claim.meta?.changes)return {status,duplicate:true,reward:null,loot:null};
  }
  const reward=status==='WON'?victoryReward(battle.enemy):status==='LOST'?defeatReward():escapedReward();
  if(reward.coins>0)await credit(env,userId,reward.coins);
  await addRpgXp(env,userId,reward.xp);
  let loot=null;
  if(status==='WON'){
    loot=await grantLoot(env,userId,rollLoot(battle.enemy));
    if(loot?.duplicate){
      const coins=Number(loot.converted?.coins||250),xp=Number(loot.converted?.xp||10);
      await credit(env,userId,coins);
      await addRpgXp(env,userId,xp);
    }
  }
  return {status,reward,loot,duplicate:false};
}
