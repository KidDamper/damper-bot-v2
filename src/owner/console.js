const OWNER_ROLE='OWNER';
const now=()=>Math.floor(Date.now()/1000);

export function isOwner(env,user){
  return !!(env.OWNER_TELEGRAM_ID && user && String(env.OWNER_TELEGRAM_ID)===String(user.telegram_id));
}

export async function ownerConsole(env,user,chatId){
  if(!isOwner(env,user)) return null;
  const rows=await env.DB.prepare(`SELECT
    (SELECT COUNT(*) FROM users) users,
    (SELECT COUNT(*) FROM game_sessions WHERE result IS NULL) active_games,
    (SELECT COUNT(*) FROM game_results) games,
    (SELECT COUNT(*) FROM transactions) transactions`).first();
  return {
    text:`👑 *CREATOR CONSOLE*\n\n🆔 Damper ID: \`000001\`\n🛡️ Role: *${OWNER_ROLE}*\n\n👥 Users: *${Number(rows?.users||0)}*\n🎮 Active games: *${Number(rows?.active_games||0)}*\n🏆 Games played: *${Number(rows?.games||0)}*\n💳 Transactions: *${Number(rows?.transactions||0)}*\n\n⚡ Creator access is enabled.`,
    reply_markup:{inline_keyboard:[[{text:'🔄 REFRESH',callback_data:'owner_console'}],[{text:'⬅️ MENU',callback_data:'menu_main'}]]}
  };
}

export async function setOwnerIdentity(env,telegramId){
  if(!env.OWNER_TELEGRAM_ID || String(env.OWNER_TELEGRAM_ID)!==String(telegramId)) return {ok:false};
  const existing=await env.DB.prepare('SELECT id,damper_id,role FROM users WHERE telegram_id=?').bind(String(telegramId)).first();
  if(existing){
    if(existing.damper_id!=='000001'){
      const reserved=await env.DB.prepare('SELECT id FROM users WHERE damper_id=? AND id<>?').bind('000001',existing.id).first();
      if(reserved) return {ok:false,error:'OWNER_ID_RESERVED'};
      await env.DB.prepare('UPDATE users SET damper_id=?,role=? WHERE id=?').bind('000001','OWNER',existing.id).run();
    }else if(existing.role!=='OWNER'){
      await env.DB.prepare('UPDATE users SET role=? WHERE id=?').bind('OWNER',existing.id).run();
    }
    return {ok:true,created:false};
  }
  return {ok:true,created:false,pending:true};
}
