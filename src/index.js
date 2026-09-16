const BANNER_FILE_ID = "AgACAgQAAxkBAAMIaqrLcsPcHMx7oPIUstU4FEnr7UYAAuEYaxsFs1lRZUeHg_eeON4BAAMCAAN5AAM9BA";
const MEME_CHANNEL = "@nah_idmeme";
const UPDATE_CHANNEL = "@Updamper_bot";
const MIN_WAGER = 50;
const DAILY_REWARD = 200;
const DAY = 86400;
const NOW = () => Math.floor(Date.now() / 1000);

async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}
const send = (env, chat_id, text, reply_markup) => tg(env, "sendMessage", { chat_id, text, parse_mode: "Markdown", ...(reply_markup ? { reply_markup } : {}) });
const photo = (env, chat_id, caption, reply_markup) => tg(env, "sendPhoto", { chat_id, photo: BANNER_FILE_ID, caption, parse_mode: "Markdown", ...(reply_markup ? { reply_markup } : {}) });
const edit = (env, chat_id, message_id, text, reply_markup) => tg(env, "editMessageText", { chat_id, message_id, text, parse_mode: "Markdown", ...(reply_markup ? { reply_markup } : {}) });
const ack = (env, id, text = "") => tg(env, "answerCallbackQuery", { callback_query_id: id, text });

const kb = (rows) => ({ inline_keyboard: rows });
const mainKeyboard = () => kb([
  [{ text: "🎮 GAMES", callback_data: "menu_games" }, { text: "💰 ECONOMY", callback_data: "menu_economy" }],
  [{ text: "⚔️ RPG", callback_data: "menu_rpg" }, { text: "🛒 SHOP", callback_data: "menu_shop" }],
  [{ text: "🗃️ VAULT", callback_data: "menu_vault" }, { text: "📊 LEADERBOARD", callback_data: "menu_leaderboard" }],
  [{ text: "👤 PROFILE", callback_data: "menu_profile" }, { text: "❓ HELP", callback_data: "menu_help" }]
]);
const back = () => kb([[{ text: "⬅️ BACK", callback_data: "menu_main" }]]);
const joinKeyboard = () => kb([
  [{ text: "🧠 JOIN MEME CHANNEL", url: "https://t.me/nah_idmeme" }],
  [{ text: "🔥 JOIN UPDATES CHANNEL", url: "https://t.me/Updamper_bot" }],
  [{ text: "✅ CHECK MEMBERSHIP", callback_data: "check_membership" }]
]);
const gamesKeyboard = () => kb([
  [{ text: "🪙 COIN FLIP", callback_data: "game_coin" }, { text: "🎲 DICE DUEL", callback_data: "game_dice" }],
  [{ text: "💣 MINES", callback_data: "game_mines" }, { text: "🎰 SLOTS", callback_data: "game_slots" }],
  [{ text: "⚽ PENALTY", callback_data: "game_penalty" }, { text: "🏁 VIRTUAL RACE", callback_data: "game_race" }],
  [{ text: "🧠 BRAIN", callback_data: "game_brain" }, { text: "⚡ REACTION", callback_data: "game_reaction" }],
  [{ text: "⬅️ BACK", callback_data: "menu_main" }]
]);
const economyKeyboard = () => kb([
  [{ text: "💰 BALANCE", callback_data: "eco_balance" }, { text: "🎁 DAILY", callback_data: "eco_daily" }],
  [{ text: "📊 STATS", callback_data: "eco_stats" }, { text: "⬅️ BACK", callback_data: "menu_main" }]
]);
const shopKeyboard = () => kb([
  [{ text: "🃏 CARDS", callback_data: "shop_cards" }, { text: "🐾 PETS", callback_data: "shop_pets" }],
  [{ text: "🔢 NUMBERED ITEMS", callback_data: "shop_numbered" }],
  [{ text: "⬅️ BACK", callback_data: "menu_main" }]
]);
const vaultKeyboard = () => kb([
  [{ text: "🃏 CARDS", callback_data: "vault_cards" }, { text: "🐾 PETS", callback_data: "vault_pets" }],
  [{ text: "🔢 NUMBERED", callback_data: "vault_numbered" }, { text: "🏆 ACHIEVEMENTS", callback_data: "vault_achievements" }],
  [{ text: "🎖️ TITLES", callback_data: "vault_titles" }, { text: "⚔️ RPG INVENTORY", callback_data: "vault_rpg" }],
  [{ text: "⬅️ BACK", callback_data: "menu_main" }]
]);

function randomId5() { return String(Math.floor(10000 + Math.random() * 90000)); }
async function uniqueDamperId(env) {
  for (let i = 0; i < 50; i++) {
    const id = randomId5();
    const hit = await env.DB.prepare("SELECT id FROM users WHERE damper_id=?").bind(id).first();
    if (!hit) return id;
  }
  throw new Error("ID allocation failed");
}
async function owner(env, telegramId) { return !!env.OWNER_TELEGRAM_ID && String(env.OWNER_TELEGRAM_ID) === String(telegramId); }
async function getUser(env, telegramId) {
  return env.DB.prepare("SELECT u.*, w.balance, x.damper_xp, x.level, x.rpg_xp, x.rpg_level FROM users u LEFT JOIN wallets w ON w.user_id=u.id LEFT JOIN xp x ON x.user_id=u.id WHERE u.telegram_id=?").bind(String(telegramId)).first();
}
async function ensureStats(env, id) { await env.DB.prepare("INSERT OR IGNORE INTO stats(user_id) VALUES(?)").bind(id).run(); }
async function ensureAccount(env, from) {
  let u = await getUser(env, from.id);
  if (u) {
    if (from.username && from.username !== u.username) await env.DB.prepare("UPDATE users SET username=? WHERE id=?").bind(from.username, u.id).run();
    return getUser(env, from.id);
  }
  const damperId = await uniqueDamperId(env), now = NOW();
  await env.DB.prepare("INSERT INTO users(telegram_id,username,damper_id,role,created_at) VALUES(?,?,?,?,?)").bind(String(from.id), from.username || null, damperId, await owner(env, from.id) ? "OWNER" : "PLAYER", now).run();
  u = await getUser(env, from.id);
  await env.DB.prepare("INSERT OR IGNORE INTO wallets(user_id,balance) VALUES(?,?)").bind(u.id, 500).run();
  await env.DB.prepare("INSERT OR IGNORE INTO xp(user_id,damper_xp,level,rpg_xp,rpg_level) VALUES(?,0,1,0,1)").bind(u.id).run();
  await ensureStats(env, u.id);
  await env.DB.prepare("INSERT OR IGNORE INTO user_achievements(user_id,achievement_id,unlocked_at) VALUES(?,?,?)").bind(u.id, "getting_started", now).run();
  return getUser(env, from.id);
}
async function isMember(env, channel, userId) {
  const r = await tg(env, "getChatMember", { chat_id: channel, user_id: userId });
  return !!(r.ok && ["creator", "administrator", "member"].includes(r.result?.status));
}
async function hasAccess(env, from) {
  if (await owner(env, from.id)) return true;
  return (await isMember(env, MEME_CHANNEL, from.id)) && (await isMember(env, UPDATE_CHANNEL, from.id));
}
async function createTx(env, userId, amount, type, source, reference = crypto.randomUUID()) {
  await env.DB.prepare("INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)").bind(userId, amount, type, source, reference, NOW()).run();
}
async function coins(env, userId, amount, type, source) {
  const u = await getUser(env, userId);
  if (!u) throw new Error("ACCOUNT_NOT_FOUND");
  if (amount < 0 && (u.balance || 0) + amount < 0) throw new Error("INSUFFICIENT");
  await env.DB.prepare("UPDATE wallets SET balance=balance+? WHERE user_id=?").bind(amount, userId).run();
  await createTx(env, userId, amount, type, source);
  if (amount > 0) await env.DB.prepare("UPDATE stats SET coins_earned=coins_earned+? WHERE user_id=?").bind(amount, userId).run();
  if (amount < 0) await env.DB.prepare("UPDATE stats SET coins_lost=coins_lost+? WHERE user_id=?").bind(-amount, userId).run();
}
function levelForXp(xp) { let level = 1, need = 100; while (xp >= need && level < 100) { xp -= need; level++; need = 100 + (level - 1) * 50; } return level; }
async function xp(env, userId, amount) {
  if (amount <= 0) return;
  const row = await env.DB.prepare("SELECT damper_xp FROM xp WHERE user_id=?").bind(userId).first();
  const total = (row?.damper_xp || 0) + amount;
  await env.DB.prepare("UPDATE xp SET damper_xp=?,level=? WHERE user_id=?").bind(total, levelForXp(total), userId).run();
  await env.DB.prepare("UPDATE stats SET xp_earned=xp_earned+? WHERE user_id=?").bind(amount, userId).run();
}
async function achievement(env, userId, id) { await env.DB.prepare("INSERT OR IGNORE INTO user_achievements(user_id,achievement_id,unlocked_at) VALUES(?,?,?)").bind(userId, id, NOW()).run(); }
async function gameRecord(env, userId, type, outcome, stake, payout, gainXp) {
  await ensureStats(env, userId);
  await env.DB.prepare("UPDATE stats SET games_played=games_played+1,games_won=games_won+?,games_lost=games_lost+?,wager_games=wager_games+?,total_staked=total_staked+?,total_won=total_won+?,total_lost=total_lost+?,biggest_stake=MAX(biggest_stake,?),biggest_payout=MAX(biggest_payout,?) WHERE user_id=?").bind(outcome === "WIN" ? 1 : 0, outcome === "LOSS" ? 1 : 0, stake > 0 ? 1 : 0, stake, Math.max(0, payout - stake), Math.max(0, stake - payout), stake, payout, userId).run();
  await env.DB.prepare("INSERT INTO game_results(user_id,game_type,outcome,stake,payout,xp,created_at) VALUES(?,?,?,?,?,?,?)").bind(userId, type, outcome, stake, payout, gainXp, NOW()).run();
  await xp(env, userId, gainXp);
  if (outcome === "WIN") await achievement(env, userId, "first_win");
}
function stakeOf(text) { const parts = String(text || "").trim().split(/\s+/); const n = Number(parts[parts.length - 1]); return Number.isFinite(n) ? Math.floor(n) : null; }
async function wager(env, chatId, u, type, stake, resolver) {
  if (!Number.isInteger(stake) || stake < MIN_WAGER) return send(env, chatId, `⚠️ Minimum wager is *${MIN_WAGER}* Damper Coins.`);
  if (stake > (u.balance || 0)) return send(env, chatId, "❌ You don't have enough Damper Coins.");
  await coins(env, u.id, -stake, "WAGER_STAKE", type);
  const result = resolver();
  const payout = Math.floor(stake * result.mult);
  if (payout > 0) await coins(env, u.id, payout, "WAGER_PAYOUT", type);
  await gameRecord(env, u.id, type, result.outcome, stake, payout, result.xp);
  return send(env, chatId, `${result.text}\n\n${payout ? `💰 Payout: *${payout}*` : `💸 Lost: *${stake}*`}\n✨ +${result.xp} XP`);
}

async function showBalance(env, chatId, u) { return send(env, chatId, `💰 *BALANCE*\n\n🪙 ${u.balance || 0} Damper Coins\n⭐ Level ${u.level || 1}\n✨ ${u.damper_xp || 0} XP`); }
async function showProfile(env, chatId, u) { return send(env, chatId, `👤 *PROFILE*\n\nUsername: ${u.username ? `@${u.username}` : "—"}\n🆔 Damper ID: \`${u.damper_id}\`\n💰 Coins: ${u.balance || 0}\n⭐ Level: ${u.level || 1}\n✨ XP: ${u.damper_xp || 0}${u.role === "OWNER" ? "\n\n👑 *CREATOR*" : ""}`); }
async function showStats(env, chatId, u) { const s = await env.DB.prepare("SELECT * FROM stats WHERE user_id=?").bind(u.id).first(); return send(env, chatId, `📊 *STATS*\n\n🎮 Games: ${s?.games_played || 0}\n🏆 Wins: ${s?.games_won || 0}\n💀 Losses: ${s?.games_lost || 0}\n💰 Coins earned: ${s?.coins_earned || 0}\n💸 Coins lost: ${s?.coins_lost || 0}\n🎲 Wagered: ${s?.total_staked || 0}\n🔥 Biggest stake: ${s?.biggest_stake || 0}\n💰 Biggest payout: ${s?.biggest_payout || 0}`); }
async function daily(env, chatId, u) {
  if (u.role === "OWNER") return send(env, chatId, "👑 *CREATOR MODE*\n\nDaily rewards are unnecessary here.");
  const row = await env.DB.prepare("SELECT expires_at FROM cooldowns WHERE user_id=? AND key='daily'").bind(u.id).first();
  if (row?.expires_at > NOW()) return send(env, chatId, `⏳ Daily is on cooldown.\n\nTry again <t:${row.expires_at}:R>.`);
  await coins(env, u.id, DAILY_REWARD, "DAILY", "daily");
  await env.DB.prepare("INSERT OR REPLACE INTO cooldowns(user_id,key,expires_at) VALUES(?,?,?)").bind(u.id, "daily", NOW() + DAY).run();
  await achievement(env, u.id, "first_daily");
  return send(env, chatId, `🎁 *DAILY CLAIMED*\n\n💰 +${DAILY_REWARD} Damper Coins\n\nCome back tomorrow.`);
}

const cardLines = (rows) => (rows || []).length ? rows.map(x => `• ${x.name} — ${x.tier} — ${x.price} Coins`).join("\n") : "No items available.";
async function shopCards(env, chatId) { const r = await env.DB.prepare("SELECT name,tier,price FROM cards ORDER BY price").all(); return send(env, chatId, `🃏 *CARDS*\n\n${cardLines(r.results)}`); }
async function shopPets(env, chatId) { const r = await env.DB.prepare("SELECT name,tier,price,luck FROM pets ORDER BY price").all(); return send(env, chatId, `🐾 *PETS*\n\n${(r.results || []).map(x => `• ${x.name} — ${x.tier} — ${x.price} Coins — Luck +${x.luck}`).join("\n") || "No pets available."}`); }
async function shopNumbered(env, chatId) { return send(env, chatId, "🔢 *NUMBERED ITEMS*\n\nEach draw costs *250,000* Damper Coins.\n\n16 original numbered artifacts exist. They are intentionally extremely rare and cannot be influenced by pets or luck items."); }
async function vault(env, chatId, u, section) {
  if (section === "vault_cards") { const r = await env.DB.prepare("SELECT c.name,c.tier,uc.quantity FROM user_cards uc JOIN cards c ON c.id=uc.card_id WHERE uc.user_id=? ORDER BY c.tier,c.name").bind(u.id).all(); return send(env, chatId, `🃏 *YOUR CARDS*\n\n${(r.results || []).map(x => `• ${x.name} — ${x.tier} ×${x.quantity}`).join("\n") || "No cards yet."}`); }
  if (section === "vault_pets") { const r = await env.DB.prepare("SELECT p.name,p.tier,p.luck FROM user_pets up JOIN pets p ON p.id=up.pet_id WHERE up.user_id=? ORDER BY p.tier,p.name").bind(u.id).all(); return send(env, chatId, `🐾 *YOUR PETS*\n\n${(r.results || []).map(x => `• ${x.name} — ${x.tier} — Luck +${x.luck}`).join("\n") || "No pets yet."}`); }
  if (section === "vault_numbered") { const r = await env.DB.prepare("SELECT n.id,n.name,n.rarity FROM user_numbered_items un JOIN numbered_items n ON n.id=un.item_id WHERE un.user_id=? ORDER BY n.id").bind(u.id).all(); const found = new Map((r.results || []).map(x => [x.id, x])); return send(env, chatId, `🔢 *NUMBERED VAULT*\n\n` + Array.from({length:16},(_,i)=>{const x=found.get(i+1);return x?`#${String(i+1).padStart(2,"0")} — ${x.name} (${x.rarity})`:`#${String(i+1).padStart(2,"0")} — ???`;}).join("\n")); }
  if (section === "vault_achievements") { const r = await env.DB.prepare("SELECT a.name,a.description,ua.unlocked_at FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE ua.user_id=? ORDER BY ua.unlocked_at").bind(u.id).all(); return send(env, chatId, `🏆 *ACHIEVEMENTS*\n\n${(r.results || []).map(x => `• ${x.name} — ${x.description}`).join("\n") || "No achievements yet."}`); }
  if (section === "vault_titles") { const r = await env.DB.prepare("SELECT t.name FROM user_titles ut JOIN titles t ON t.id=ut.title_id WHERE ut.user_id=?").bind(u.id).all(); return send(env, chatId, `🎖️ *TITLES*\n\n${(r.results || []).map(x => `• ${x.name}`).join("\n") || "Titles are earned, never purchased."}`); }
  if (section === "vault_rpg") { const r = await env.DB.prepare("SELECT item_id,item_type,quantity FROM rpg_inventory WHERE user_id=? ORDER BY item_type,item_id").bind(u.id).all(); return send(env, chatId, `⚔️ *RPG INVENTORY*\n\n${(r.results || []).map(x => `• ${x.item_id} — ${x.item_type} ×${x.quantity}`).join("\n") || "No RPG items yet."}`); }
  return send(env, chatId, "🗃️ *VAULT*\n\nChoose a collection:", vaultKeyboard());
}

async function leaderboard(env, chatId) {
  const r = await env.DB.prepare("SELECT u.username,u.damper_id,w.balance FROM users u JOIN wallets w ON w.user_id=u.id WHERE u.role!='OWNER' ORDER BY w.balance DESC LIMIT 10").all();
  return send(env, chatId, `📊 *RICHEST PLAYERS*\n\n${(r.results || []).map((x,i)=>`${i+1}. ${x.username ? `@${x.username}` : `ID ${x.damper_id}`} — ${x.balance}`).join("\n") || "No players yet."}`);
}
async function rpgMenu(env, chatId, u) { return send(env, chatId, `⚔️ *RPG*\n\nLevel ${u.rpg_level || 1}\nRPG XP ${u.rpg_xp || 0}\n\nThe battle/shop engine is wired into the V2 core and will use the same Damper account.`, back()); }

async function command(env, msg, text) {
  const chatId = msg.chat.id, c = String(text || "").trim().split(/\s+/)[0].toLowerCase();
  const from = msg.from;
  if (c === "/start") {
    if (!(await hasAccess(env, from))) return photo(env, chatId, "🔥 *THE DAMPER_BOT V2*\n\nBefore entering, join both official KIDDAMPER channels, then tap CHECK MEMBERSHIP.", joinKeyboard());
    const u = await ensureAccount(env, from);
    return photo(env, chatId, `🔥 *THE DAMPER_BOT V2*\n\nWelcome${u.username ? `, @${u.username}` : ""}.\n\n🆔 Damper ID: \`${u.damper_id}\`\n💰 Balance: ${u.balance || 0} Coins\n⭐ Level: ${u.level || 1}\n\nChoose your destination.`, mainKeyboard());
  }
  if (!(await hasAccess(env, from))) return send(env, chatId, "🔒 Access is locked. Use /start to verify both channels.", joinKeyboard());
  const u = await ensureAccount(env, from);
  if (c === "/menu") return send(env, chatId, "🔥 *THE DAMPER_BOT V2*\n\nChoose your destination.", mainKeyboard());
  if (c === "/balance") return showBalance(env, chatId, u);
  if (c === "/profile") return showProfile(env, chatId, u);
  if (c === "/stats") return showStats(env, chatId, u);
  if (c === "/daily") return daily(env, chatId, u);
  if (c === "/games") return send(env, chatId, "🎮 *GAMES*\n\nWager minimum: 50 Damper Coins.\n\nPick a game:", gamesKeyboard());
  if (c === "/shop") return send(env, chatId, "🛒 *SHOP*\n\nCards, Pets and Numbered Items.", shopKeyboard());
  if (c === "/vault") return vault(env, chatId, u);
  if (c === "/leaderboard") return leaderboard(env, chatId);
  if (c === "/rpg") return rpgMenu(env, chatId, u);
  if (c === "/ping") return send(env, chatId, "🏓 Pong! V2 is alive.");
  if (c === "/help") return send(env, chatId, "❓ *HELP*\n\n/start — enter bot\n/menu — main menu\n/games — games\n/balance — coins\n/daily — daily reward\n/give — transfer coins\n/profile — profile\n/stats — statistics\n/leaderboard — richest\n/shop — shop\n/vault — collections\n/rpg — RPG\n/ping — health check");
  if (c === "/coin") return wager(env, chatId, u, "COIN_FLIP", stakeOf(text), () => Math.random() < 0.5 ? {mult:1.9,outcome:"WIN",xp:8,text:"🪙 *COIN FLIP*\n\nHeads — you won!"} : {mult:0,outcome:"LOSS",xp:2,text:"🪙 *COIN FLIP*\n\nTails — the coin escaped you."});
  if (c === "/dice") return wager(env, chatId, u, "DICE_DUEL", stakeOf(text), () => { const you=1+Math.floor(Math.random()*6), bot=1+Math.floor(Math.random()*6); return you>bot?{mult:1.8,outcome:"WIN",xp:10,text:`🎲 *DICE DUEL*\n\nYou: ${you}\nBot: ${bot}\n\nYou win.`}:you===bot?{mult:1,outcome:"DRAW",xp:4,text:`🎲 *DICE DUEL*\n\nYou: ${you}\nBot: ${bot}\n\nDraw — stake returned.`}:{mult:0,outcome:"LOSS",xp:2,text:`🎲 *DICE DUEL*\n\nYou: ${you}\nBot: ${bot}\n\nYou lose.`}; });
  if (c === "/penalty") { const parts=String(text).trim().split(/\s+/), direction=(parts[1]||"").toLowerCase(), stake=Number(parts[2]); const valid=["center","left","right","top-left","top-right"]; if(!valid.includes(direction)) return send(env,chatId,"⚽ Usage: /penalty <center|left|right|top-left|top-right> <wager>"); return wager(env,chatId,u,"PENALTY",stake,()=>{const save=Math.random()<0.38; if(save)return {mult:0,outcome:"LOSS",xp:3,text:`⚽ *PENALTY*\n\nShot: ${direction}\n🧤 Saved.`}; const mult=direction==="center"?1.4:["left","right"].includes(direction)?2:3; return {mult,outcome:"WIN",xp:12,text:`⚽ *PENALTY*\n\nShot: ${direction}\n🥅 GOAL!`};}); }
  if (c === "/give") { const a=String(text).trim().split(/\s+/); let target=null, amount=0; if(msg.reply_to_message?.from){target=await getUser(env,msg.reply_to_message.from.id);amount=Number(a[1]);} else {target=await env.DB.prepare("SELECT * FROM users WHERE username=?").bind(String(a[1]||"").replace(/^@/,"")).first();amount=Number(a[2]);} if(!target||!Number.isInteger(amount)||amount<=0)return send(env,chatId,"Usage: reply with /give 50 or use /give @username 50"); if(target.id===u.id)return send(env,chatId,"❌ You can't give Coins to yourself."); if(u.role!=="OWNER"&&amount>(u.balance||0))return send(env,chatId,"❌ Insufficient Coins."); if(u.role!=="OWNER")await coins(env,u.id,-amount,"TRANSFER_OUT","give"); else await createTx(env,u.id,0,"CREATOR_GIFT","give"); await coins(env,target.id,amount,"TRANSFER_IN",u.role==="OWNER"?"creator_gift":"give"); return send(env,chatId,`${u.role==="OWNER"?"🎁 Creator Gift":"🎁 Sent"} *${amount}* Damper Coins to ${target.username?`@${target.username}`:`ID ${target.damper_id}`}.`); }
  return send(env,chatId,"🤔 I don't know that command yet. Try /help.");
}

async function callback(env, q) {
  const from=q.from, chatId=q.message?.chat?.id, messageId=q.message?.message_id, data=q.data||"";
  if (!(await hasAccess(env,from))) { await ack(env,q.id,"Join both channels first."); return edit(env,chatId,messageId,"🔒 *ACCESS LOCKED*\n\nJoin both official channels, then check membership.",joinKeyboard()); }
  const u=await ensureAccount(env,from);
  await ack(env,q.id);
  if(data==="check_membership") { if(await hasAccess(env,from)) return edit(env,chatId,messageId,"✅ *MEMBERSHIP VERIFIED*\n\nAccess granted.\n\nChoose your destination.",mainKeyboard()); return edit(env,chatId,messageId,"❌ You still need to join both channels.",joinKeyboard()); }
  if(data==="menu_main") return edit(env,chatId,messageId,"🔥 *THE DAMPER_BOT V2*\n\nChoose your destination.",mainKeyboard());
  if(data==="menu_games") return edit(env,chatId,messageId,"🎮 *GAMES*\n\nWager minimum: 50 Damper Coins.",gamesKeyboard());
  if(data==="menu_economy") return edit(env,chatId,messageId,"💰 *ECONOMY*\n\nDamper Coins, daily rewards and stats.",economyKeyboard());
  if(data==="menu_shop") return edit(env,chatId,messageId,"🛒 *SHOP*\n\nCards, Pets and Numbered Items.",shopKeyboard());
  if(data==="menu_vault") return edit(env,chatId,messageId,"🗃️ *VAULT*\n\nYour collections and progression.",vaultKeyboard());
  if(data==="menu_profile") { await showProfile(env,chatId,u); return; }
  if(data==="menu_leaderboard") { await leaderboard(env,chatId); return; }
  if(data==="menu_help") { await send(env,chatId,"❓ *HELP*\n\nUse /help for commands.\n\nWager minimum: 50 Damper Coins."); return; }
  if(data==="menu_rpg") return rpgMenu(env,chatId,u);
  if(data==="eco_balance") return showBalance(env,chatId,u);
  if(data==="eco_daily") return daily(env,chatId,u);
  if(data==="eco_stats") return showStats(env,chatId,u);
  if(data==="shop_cards") return shopCards(env,chatId);
  if(data==="shop_pets") return shopPets(env,chatId);
  if(data==="shop_numbered") return shopNumbered(env,chatId);
  if(data.startsWith("vault_")) return vault(env,chatId,u,data);
  if(data==="game_coin") return send(env,chatId,"🪙 *COIN FLIP*\n\nUse /coin 50 (minimum 50).",back());
  if(data==="game_dice") return send(env,chatId,"🎲 *DICE DUEL*\n\nUse /dice 50 (minimum 50).",back());
  if(data==="game_penalty") return send(env,chatId,"⚽ *PENALTY*\n\nUse /penalty left 50, /penalty center 50, /penalty top-left 50, etc.",back());
  if(data==="game_mines") return send(env,chatId,"💣 *MINES*\n\n12 tiles / 3 mines. The wager engine is ready; interactive tile sessions are next in the game-session layer.",back());
  if(data==="game_slots") return send(env,chatId,"🎰 *SLOTS*\n\nThe wager engine is ready; interactive spin resolution is next in the game-session layer.",back());
  if(data==="game_race") return send(env,chatId,"🏁 *VIRTUAL RACE*\n\nThe wager engine is ready; multi-choice race sessions are next in the game-session layer.",back());
  if(data==="game_brain") return send(env,chatId,"🧠 *BRAIN*\n\nTrivia, Math, Anagram, Emoji and Flag Quiz are being loaded from the curated question bank.",back());
  if(data==="game_reaction") return send(env,chatId,"⚡ *REACTION*\n\nFastest, Type Challenge and Reaction Test are being wired into group sessions.",back());
  return send(env,chatId,"That button is not available in this build.",back());
}

export default {
  async fetch(request, env) {
    try {
      const url=new URL(request.url);
      if(url.pathname==="/"&&request.method==="GET") { const tables=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all(); return Response.json({status:"online",database:"connected",telegram:env.TELEGRAM_BOT_TOKEN?"configured":"missing",tables:tables.results||[]}); }
      if(url.pathname==="/telegram/webhook"&&request.method==="POST") { const update=await request.json(); if(update.callback_query) await callback(env,update.callback_query); else if(update.message?.text) await command(env,update.message,update.message.text); return new Response("OK"); }
      return new Response("OK");
    } catch(e) { console.error(e); return new Response("OK"); }
  }
};