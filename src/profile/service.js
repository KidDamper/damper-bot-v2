import { achievementSummary } from '../achievements/format.js';

export async function getProfileSummary(env,userId){
  const row=await env.DB.prepare(`SELECT u.id,u.damper_id,u.username,u.role,w.balance,x.damper_xp,x.level,x.rpg_xp,x.rpg_level,COALESCE(s.games_played,0) games_played,COALESCE(s.games_won,0) games_won FROM users u LEFT JOIN wallets w ON w.user_id=u.id LEFT JOIN xp x ON x.user_id=u.id LEFT JOIN stats s ON s.user_id=u.id WHERE u.id=?`).bind(userId).first();
  if(!row)return null;
  const achievements=await achievementSummary(env,userId);
  const played=Number(row.games_played||0),won=Number(row.games_won||0);
  return {...row,achievements,win_rate:played?Math.round((won/played)*10000)/100:0};
}

export function formatProfileSummary(profile){
  if(!profile)return '👤 *PROFILE*\n\nProfile not found.';
  const creator=profile.role==='OWNER'&&profile.damper_id==='000001';
  return `👤 *PROFILE*\n\n🆔 Damper ID: \`${profile.damper_id}\`\n${profile.username?`👤 @${profile.username}\n`:''}💰 Coins: *${Number(profile.balance||0)}*\n⭐ Level: *${Number(profile.level||1)}*\n✨ Damper XP: *${Number(profile.damper_xp||0)}*\n⚔️ RPG Level: *${Number(profile.rpg_level||1)}*\n⚡ RPG XP: *${Number(profile.rpg_xp||0)}*\n\n🎮 Games: *${Number(profile.games_played||0)}*\n🏆 Wins: *${Number(profile.games_won||0)}*\n📈 Win rate: *${Number(profile.win_rate||0)}%*\n🏅 Achievements: *${profile.achievements.unlocked}/${profile.achievements.total}*${creator?'\n\n👑 *CREATOR*\n🏷️ Title: *CREATOR*':''}`;
}
