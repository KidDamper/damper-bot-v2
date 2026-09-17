const metricMap={coins:'COALESCE(w.balance,0)',xp:'COALESCE(x.damper_xp,0)',wins:'COALESCE(s.games_won,0)',games:'COALESCE(s.games_played,0)',rpg:'COALESCE(x.rpg_xp,0)',collector:'(COALESCE(c.cards,0)+COALESCE(p.pets,0)+COALESCE(n.numbered,0))',achievements:'COALESCE(a.achievements,0)',wager:'COALESCE(wg.staked,0)'};
const metricLabels={coins:'💰 RICHEST',xp:'⭐ XP',wins:'🏆 WINS',games:'🎮 GAMES',rpg:'⚔️ RPG',collector:'🃏 COLLECTOR',achievements:'🏅 ACHIEVEMENTS'};
const limitValue=(limit)=>Math.max(1,Math.min(50,Number(limit)||10));

export async function leaderboard(env,metric='coins',limit=10){
  if(!metricMap[metric])return [];
  const order=metricMap[metric];
  const q=`SELECT u.damper_id,u.username,${order} value,COALESCE(s.games_won,0) wins,COALESCE(s.games_played,0) games,COALESCE(x.damper_xp,0) xp FROM users u LEFT JOIN wallets w ON w.user_id=u.id LEFT JOIN xp x ON x.user_id=u.id LEFT JOIN stats s ON s.user_id=u.id LEFT JOIN (SELECT user_id,COUNT(*) cards FROM user_cards GROUP BY user_id)c ON c.user_id=u.id LEFT JOIN (SELECT user_id,COUNT(*) pets FROM user_pets GROUP BY user_id)p ON p.user_id=u.id LEFT JOIN (SELECT user_id,COUNT(*) numbered FROM user_numbered_items GROUP BY user_id)n ON n.user_id=u.id LEFT JOIN (SELECT user_id,COUNT(*) achievements FROM user_achievements GROUP BY user_id)a ON a.user_id=u.id LEFT JOIN (SELECT user_id,SUM(stake) staked FROM wagers GROUP BY user_id)wg ON wg.user_id=u.id WHERE u.role!='OWNER' ORDER BY value DESC,wins DESC,xp DESC,u.id ASC LIMIT ?`;
  const r=await env.DB.prepare(q).bind(limitValue(limit)).all();return r.results||[];
}

export async function periodLeaderboard(env,metric='xp',days=7,limit=10){
  const column=metric==='wins'?'CASE WHEN outcome=\'WIN\' THEN 1 ELSE 0 END':metric==='games'?'1':metric==='wager'?'stake':metric==='coins'?'CASE WHEN payout>stake THEN payout-stake ELSE 0 END':metric==='xp'?'xp':null;
  if(!column)return [];
  const since=Math.floor(Date.now()/1000)-Math.max(1,Number(days)||7)*86400;
  const q=`SELECT u.damper_id,u.username,SUM(${column}) value FROM game_results gr JOIN users u ON u.id=gr.user_id WHERE u.role!='OWNER' AND gr.created_at>=? GROUP BY u.id ORDER BY value DESC,u.id ASC LIMIT ?`;
  const r=await env.DB.prepare(q).bind(since,limitValue(limit)).all();return r.results||[];
}

export function leaderboardTitle(metric='coins'){return metricLabels[metric]||'🏆 LEADERBOARD';}

export function formatLeaderboard(rows,title='LEADERBOARD'){
  if(!rows.length)return `🏆 *${title}*\n\nNo entries yet.`;
  return `🏆 *${title}*\n\n${rows.map((r,i)=>{const rank=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;return `${rank} ${r.username?`@${r.username}`:r.damper_id} — ${Number(r.value)||0}`;}).join('\n')}`;
}
