const metricMap={coins:'w.balance',xp:'x.damper_xp',wins:'s.games_won',games:'s.games_played',rpg:'x.rpg_xp',collector:'(COALESCE(c.cards,0)+COALESCE(p.pets,0)+COALESCE(n.numbered,0))',achievements:'COALESCE(a.achievements,0)',wager:'COALESCE(wg.staked,0)'};
export async function leaderboard(env,metric='coins',limit=10){
  if(!metricMap[metric])return [];
  const order=metricMap[metric];
  const q=`SELECT u.damper_id,u.username,${order} value FROM users u LEFT JOIN wallets w ON w.user_id=u.id LEFT JOIN xp x ON x.user_id=u.id LEFT JOIN stats s ON s.user_id=u.id LEFT JOIN (SELECT user_id,COUNT(*) cards FROM user_cards GROUP BY user_id)c ON c.user_id=u.id LEFT JOIN (SELECT user_id,COUNT(*) pets FROM user_pets GROUP BY user_id)p ON p.user_id=u.id LEFT JOIN (SELECT user_id,COUNT(*) numbered FROM user_numbered_items GROUP BY user_id)n ON n.user_id=u.id LEFT JOIN (SELECT user_id,COUNT(*) achievements FROM user_achievements GROUP BY user_id)a ON a.user_id=u.id LEFT JOIN (SELECT user_id,SUM(stake) staked FROM wagers GROUP BY user_id)wg ON wg.user_id=u.id WHERE u.role!='OWNER' ORDER BY value DESC,u.id ASC LIMIT ?`;
  const r=await env.DB.prepare(q).bind(Math.max(1,Math.min(50,Number(limit)||10))).all();return r.results||[];
}
export function formatLeaderboard(rows,title='LEADERBOARD'){if(!rows.length)return `🏆 *${title}*\n\nNo entries yet.`;return `🏆 *${title}*\n\n${rows.map((r,i)=>`${i+1}. ${r.username?`@${r.username}`:r.damper_id} — ${r.value}`).join('\n')}`;}
