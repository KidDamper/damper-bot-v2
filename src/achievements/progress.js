import { unlockAchievement, grantTitle } from './engine.js';

const RULES = [
  ['getting_started', async () => true],
  ['first_win', async env => Number((await env.DB.prepare('SELECT games_won FROM stats WHERE user_id=?').bind(env.userId).first())?.games_won || 0) >= 1],
  ['level_10', async env => Number((await env.DB.prepare('SELECT level FROM xp WHERE user_id=?').bind(env.userId).first())?.level || 1) >= 10],
  ['level_50', async env => Number((await env.DB.prepare('SELECT level FROM xp WHERE user_id=?').bind(env.userId).first())?.level || 1) >= 50],
  ['millionaire', async env => Number((await env.DB.prepare('SELECT balance FROM wallets WHERE user_id=?').bind(env.userId).first())?.balance || 0) >= 1000000],
  ['first_card', async env => Number((await env.DB.prepare('SELECT COUNT(*) n FROM user_cards WHERE user_id=?').bind(env.userId).first())?.n || 0) > 0],
  ['pet_owner', async env => Number((await env.DB.prepare('SELECT COUNT(*) n FROM user_pets WHERE user_id=?').bind(env.userId).first())?.n || 0) > 0],
  ['number_hunter', async env => Number((await env.DB.prepare('SELECT COUNT(*) n FROM user_numbered_items WHERE user_id=?').bind(env.userId).first())?.n || 0) > 0],
  ['collector', async env => {
    const [cards,pets,numbered] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) n FROM user_cards WHERE user_id=?').bind(env.userId).first(),
      env.DB.prepare('SELECT COUNT(*) n FROM user_pets WHERE user_id=?').bind(env.userId).first(),
      env.DB.prepare('SELECT COUNT(*) n FROM user_numbered_items WHERE user_id=?').bind(env.userId).first()
    ]);
    return Number(cards?.n||0)+Number(pets?.n||0)+Number(numbered?.n||0) >= 10;
  }]
];

export async function checkProgress(env,userId){
  const ctx={DB:env.DB,userId};
  const unlocked=[];
  for(const [id,test] of RULES){
    if(await test(ctx)){
      const result=await unlockAchievement(env,userId,id);
      if(result.ok)unlocked.push(result.achievement);
    }
  }
  return unlocked;
}

export async function checkAndGrantCreatorTitle(env,user){
  if(!user || user.role!=='OWNER' || String(user.damper_id)!=='000001')return {ok:false};
  return grantTitle(env,user.id,'creator');
}
