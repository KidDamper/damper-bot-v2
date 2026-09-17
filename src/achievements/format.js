import { listAchievements } from './engine.js';

export async function achievementSummary(env,userId){
  const rows=await listAchievements(env,userId);
  const unlocked=rows.filter(x=>Number(x.unlocked)===1);
  return {total:rows.length,unlocked:unlocked.length,locked:Math.max(0,rows.length-unlocked.length),rows};
}

export function formatAchievements(summary,{title='ACHIEVEMENTS'}={}){
  if(!summary?.rows?.length)return `🏆 *${title}*\n\nNo achievements configured yet.`;
  const lines=summary.rows.map((a)=>Number(a.unlocked)===1?`✅ *${a.name}* — ${a.description}`:`🔒 *???* — Hidden achievement`);
  return `🏆 *${title}*\n\nProgress: *${summary.unlocked}/${summary.total}*\n\n${lines.join('\n')}`;
}

export function formatAchievementUnlocks(items=[]){
  if(!items.length)return '';
  return `\n\n🏆 *ACHIEVEMENT UNLOCKED*\n${items.map(a=>`✨ *${a.name}* — ${a.description}`).join('\n')}`;
}
