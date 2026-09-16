const BANNER_FILE_ID = "AgACAgQAAxkBAAMIaqrLcsPcHMx7oPIUstU4FEnr7UYAAuEYaxsFs1lRZUeHg_eeON4BAAMCAAN5AAM9BA";
const MEME_CHANNEL = "@nah_idmeme";
const UPDATE_CHANNEL = "@Updamper_bot";
const MIN_WAGER = 50;
const DAILY_REWARD = 200;
const NOW = () => Math.floor(Date.now() / 1000);

async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
  });
  return r.json();
}
const send = (env, chat_id, text, reply_markup) => tg(env, "sendMessage", { chat_id, text, parse_mode: "Markdown", ...(reply_markup ? { reply_markup } : {}) });
const photo = (env, chat_id, caption, reply_markup) => tg(env, "sendPhoto", { chat_id, photo: BANNER_FILE_ID, caption, parse_mode: "Markdown", ...(reply_markup ? { reply_markup } : {}) });
const edit = (env, chat_id, message_id, text, reply_markup) => tg(env, "editMessageText", { chat_id, message_id, text, parse_mode: "Markdown", ...(reply_markup ? { reply_markup } : {}) });
const ack = (env, id, text = "") => tg(env, "answerCallbackQuery", { callback_query_id: id, text });

function mainKeyboard() {
  return { inline_keyboard: [
    [{text:"🎮 GAMES",callback_data:"menu_games"},{text:"💰 ECONOMY",callback_data:"menu_economy"}],
    [{text:"⚔️ RPG",callback_data:"menu_rpg"},{text:"🛒 SHOP",callback_data:"menu_shop"}],
    [{text:"🗃️ VAULT",callback_data:"menu_vault"},{text:"📊 LEADERBOARD",callback_data:"menu_leaderboard"}],
    [{text:"👤 PROFILE",callback_data:"menu_profile"},{text:"❓ HELP",callback_data:"menu_help"}]
  ]};
}
function back() { return {inline_keyboard:[[{text:"⬅️ BACK",callback_data:"menu_main"}]]}; }
function joinKeyboard() { return {inline_keyboard:[
  [{text:"🧠 JOIN MEME CHANNEL",url:"https://t.me/nah_idmeme"}],
  [{text:"🔥 JOIN UPDATES CHANNEL",url:"https://t.me/Updamper_bot"}],
  [{text:"✅ CHECK MEMBERSHIP",callback_data:"check_membership"}]
]}; }
function gameKeyboard() { return {inline_keyboard:[
  [{text:"🪙 COIN FLIP",callback_data:"game_coin"},{text:"🎲 DICE DUEL",callback_data:"game_dice"}],
  [{text:"💣 MINES",callback_data:"game_mines"},{text:"🎰 SLOTS",callback_data:"game_slots"}],
  [{text:"⚽ PENALTY",callback_data:"game_penalty"},{text:"🏁 VIRTUAL RACE",callback_data:"game_race"}],
  [{text:"🧠 BRAIN",callback_data:"game_brain"},{text:"⚡ REACTION",callback_data:"game_reaction"}],
  [{text:"⬅️ BACK",callback_data:"menu_main"}]
]}; }
function economyKeyboard(){return {inline_keyboard:[
  [{text:"💰 BALANCE",callback_data:"eco_balance"},{text:"🎁 DAILY",callback_data:"eco_daily"}],
  [{text:"📊 STATS",callback_data:"eco_stats"},{text:"⬅️ BACK",callback_data:"menu_main"}]
]};}
function shopKeyboard(){return {inline_keyboard:[
  [{text:"🃏 CARDS",callback_data:"shop_cards"},{text:"🐾 PETS",callback_data:"shop_pets"}],
  [{text:"🔢 NUMBERED ITEMS",callback_data:"shop_numbered"}],
  [{text:"⬅️ BACK",callback_data:"menu_main"}]
]};}
function vaultKeyboard(){return {inline_keyboard:[
  [{text:"🃏 CARDS",callback_data:"vault_cards"},{text:"🐾 PETS",callback_data:"vault_pets"}],
  [{text:"🔢 NUMBERED",callback_data:"vault_numbered"},{text:"🏆 ACHIEVEMENTS",callback_data:"vault_achievements"}],
  [{text:"🎖️ TITLES",callback_data:"vault_titles"},{text:"⚔️ RPG INVENTORY",callback_data:"vault_rpg"}],
  [{text:"⬅️ BACK",callback_data:"menu_main"}]
]};}

function id5(){return String(Math.floor(10000+Math.random()*90000));}
async function uniqueId(env){for(let i=0;i<30;i++){const x=id5();const e=await env.DB.prepare("SELECT id FROM users WHERE damper_id=?").bind(x).first();if(!e)return x;}throw new Error("ID allocation failed");}
async function getUser(env, telegramId){return env.DB.prepare("SELECT u.*,w.balance,x.damper_xp,x.level,x.rpg_xp,x.rpg_level FROM users u LEFT JOIN wallets w ON w.user_id=u.id LEFT JOIN xp x ON x.user_id=u.id WHERE u.telegram_id=?").bind(String(telegramId)).first();}
async function ensureStats(env,userId){await env.DB.prepare("INSERT OR IGNORE INTO stats(user_id) VALUES(?)").bind(userId).run();}
async function ensureAccount(env, from){
  let u=await getUser(env,from.id); if(u){ if(from.username && from.username!==u.username) await env.DB.prepare("UPDATE users SET username=? WHERE id=?").bind(from.username,u.id).run(); return getUser(env,from.id); }
  const damperId=await uniqueId(env), t=NOW();
  await env.DB.prepare("INSERT INTO users(telegram_id,username,damper_id,role,created_at) VALUES(?,?,?,?,?)").bind(String(from.id),from.username||null,damperId,"PLAYER",t).run();
  u=await getUser(env,from.id);
  await env.DB.prepare("INSERT OR IGNORE INTO wallets(user_id,balance) VALUES(?,500)").bind(u.id).run();
  await env.DB.prepare("INSERT OR IGNORE INTO xp(user_id,damper_xp,level,rpg_xp,rpg_level) VALUES(?,0,1,0,1)").bind(u.id).run();
  await ensureStats(env,u.id); await env.DB.prepare("INSERT OR IGNORE INTO user_achievements(user_id,achievement_id,unlocked_at) VALUES(?,?,?)").bind(u.id,"getting_started",t).run();
  return getUser(env,from.id);
}
async function member(env,channel,userId){const r=await tg(env,"getChatMember",{chat_id:channel,user_id:userId});return !!(r.ok && ["creator","administrator","member"].includes(r.result?.status));}
async function access(env,from){
  const u=await getUser(env,from.id); if(u?.role==="OWNER")return true;
  return (await member(env,MEME_CHANNEL,from.id)) && (await member(env,UPDATE_CHANNEL,from.id));
}
async function createTransaction(env,userId,amount,type,source){const ref=`${type}:${userId}:${NOW()}:${crypto.randomUUID()}`;await env.DB.prepare("INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)").bind(userId,amount,type,source,ref,NOW()).run();}
async function changeCoins(env,userId,amount,type,source){
  const u=await getUser(env,userId); if(!u)throw new Error("ACCOUNT_NOT_FOUND");
  if(amount<0 && u.balance+amount<0)throw new Error("INSUFFICIENT");
  await env.DB.prepare("UPDATE wallets SET balance=balance+? WHERE user_id=?").bind(amount,userId).run();
  await createTransaction(env,userId,amount,type,source);
  if(amount>0)await env.DB.prepare("UPDATE stats SET coins_earned=coins_earned+? WHERE user_id=?").bind(amount,userId).run();
  if(amount<0)await env.DB.prepare("UPDATE stats SET coins_lost=coins_lost+? WHERE user_id=?").bind(-amount,userId).run();
}
function levelForXp(xp){let level=1,need=100;while(xp>=need&&level<100){xp-=need;level++;need=100+((level-1)*50);}return level;}
async function rewardXp(env,userId,amount){if(amount<=0)return;const x=await env.DB.prepare("SELECT damper_xp FROM xp WHERE user_id=?").bind(userId).first();const next=(x?.damper_xp||0)+amount;const level=levelForXp(next);await env.DB.prepare("UPDATE xp SET damper_xp=?,level=? WHERE user_id=?").bind(next,level,userId).run();await env.DB.prepare("UPDATE stats SET xp_earned=xp_earned+? WHERE user_id=?").bind(amount,userId).run();}
async function recordGame(env,userId,type,outcome,stake,payout,xp){await ensureStats(env,userId);await env.DB.prepare("UPDATE stats SET games_played=games_played+1,games_won=games_won+?,games_lost=games_lost+?,wager_games=wager_games+?,total_staked=total_staked+?,total_won=total_won+?,total_lost=total_lost+?,biggest_stake=MAX(biggest_stake,?),biggest_payout=MAX(biggest_payout,?) WHERE user_id=?").bind(outcome==="WIN"?1:0,outcome==="LOSS"?1:0,stake>0?1:0,stake,Math.max(0,payout-stake),Math.max(0,stake-payout),stake,payout,userId).run();await env.DB.prepare("INSERT INTO game_results(user_id,game_type,outcome,stake,payout,xp,created_at) VALUES(?,?,?,?,?,?,?)").bind(userId,type,outcome,stake,payout,xp,NOW()).run();await rewardXp(env,userId,xp);}
async function maybeAch(env,userId,id){await env.DB.prepare("INSERT OR IGNORE INTO user_achievements(user_id,achievement_id,unlocked_at) VALUES(?,?,?)").bind(userId,id,NOW()).run();}

async function daily(env,chatId,u){const cd=await env.DB.prepare("SELECT expires_at FROM cooldowns WHERE user_id=? AND key='daily'").bind(u.id).first();if(cd&&cd.expires_at>NOW())return send(env,chatId,`⏳ Daily is on cooldown.\n\nTry again <t:${cd.expires_at}:R>.`);await changeCoins(env,u.id,DAILY_REWARD,"DAILY","daily");await env.DB.prepare("INSERT OR REPLACE INTO cooldowns(user_id,key,expires_at) VALUES(?,?,?)").bind(u.id,"daily",NOW()+86400).run();await maybeAch(env,u.id,"first_daily");return send(env,chatId,`🎁 *DAILY CLAIMED*\n\n💰 +${DAILY_REWARD} Damper Coins\n\nCome back tomorrow.`);}
async function balance(env,chatId,u){return send(env,chatId,`💰 *BALANCE*\n\n🪙 ${u.balance} Damper Coins\n⭐ Level ${u.level}\n✨ ${u.damper_xp} XP`);}
async function profile(env,chatId,u){return send(env,chatId,`👤 *PROFILE*\n\nUsername: ${u.username?`@${u.username}`:"—"}\n🆔 Damper ID: \`${u.damper_id}\`\n💰 Coins: ${u.balance}\n⭐ Level: ${u.level}\n✨ XP: ${u.damper_xp}`);}
async function stats(env,chatId,u){const s=await env.DB.prepare("SELECT * FROM stats WHERE user_id=?").bind(u.id).first();return send(env,chatId,`📊 *STATS*\n\nGames: ${s?.games_played||0}\nWins: ${s?.games_won||0}\nLosses: ${s?.games_lost||0}\nCoins earned: ${s?.coins_earned||0}\nCoins lost: ${s?.coins_lost||0}\nWagered: ${s?.total_staked||0}\nBiggest stake: ${s?.biggest_stake||0}\nBiggest payout: ${s?.biggest_payout||0}`);}

async function wagerGame(env,chatId,u,type,stake,calc){
  if(!Number.isInteger(stake)||stake<MIN_WAGER)return send(env,chatId,`⚠️ Minimum wager is *${MIN_WAGER}* Damper Coins.`);
  if(stake>u.balance)return send(env,chatId,"❌ You don't have enough Damper Coins.");
  await changeCoins(env,u.id,-stake,"WAGER_STAKE",type);const r=calc();const payout=Math.floor(stake*r.mult);if(payout)await changeCoins(env,u.id,payout,"WAGER_PAYOUT",type);await recordGame(env,u.id,type,r.outcome,stake,payout,r.xp);if(r.outcome==="WIN")await maybeAch(env,u.id,"first_win");const label=payout?`💰 Payout: *${payout}*`:`💸 Lost: *${stake}*`;return send(env,chatId,`${r.text}\n\n${label}\n✨ +${r.xp} XP`);}
function parseStake(text){const p=text.trim().split(/\s+/);const n=Number(p[p.length-1]);return Number.isFinite(n)?Math.floor(n):null;}

async function command(env,msg,text){const chatId=msg.chat.id,u=await ensureAccount(env,msg.from);const c=text.split(/\s+/)[0].toLowerCase();
  if(c==="/balance")return balance(env,chatId,u);if(c==="/profile")return profile(env,chatId,u);if(c==="/stats")return stats(env,chatId,u);if(c==="/daily")return daily(env,chatId,u);
  if(c==="/menu")return send(env,chatId,"🔥 *THE DAMPER_BOT V2*\n\nChoose your destination.",mainKeyboard());
  if(c==="/games")return send(env,chatId,"🎮 *GAMES*\n\nMinimum wager: 50 Damper Coins.\n\nPick a game:",gameKeyboard());
  if(c==="/shop")return send(env,chatId,"🛒 *SHOP*\n\nCards, Pets and Numbered Items.",shopKeyboard());
  if(c==="/vault")return send(env,chatId,"🗃️ *VAULT*\n\nYour collections and progression.",vaultKeyboard());
  if(c==="/leaderboard"){const rows=await env.DB.prepare("SELECT u.username,u.damper_id,w.balance FROM users u JOIN wallets w ON w.user_id=u.id WHERE u.role!='OWNER' ORDER BY w.balance DESC LIMIT 10").all();return send(env,chatId,"📊 *RICHEST*\n\n"+(rows.results||[]).map((x,i)=>`${i+1}. ${x.username?`@${x.username}`:`ID ${x.damper_id}`} — ${x.balance}`).join("\n")||"No players yet.");}
  if(c==="/give"){const args=text.split(/\s+/);let target=null,amount=0;if(msg.reply_to_message?.from){target=await getUser(env,msg.reply_to_message.from.id);amount=Number(args[1]);}else{amount=Number(args[args.length-1]);const uname=args[1]?.replace(/^@/,"");if(uname)target=await env.DB.prepare("SELECT * FROM users WHERE username=?").bind(uname).first();}if(!target||!Number.isInteger(amount)||amount<=0)return send(env,chatId,"Usage: reply to a user with /give 50, or /give @username 50");if(target.id===u.id)return send(env,chatId,"❌ You can't give Coins to yourself.");if(amount>u.balance)return send(env,chatId,"❌ Insufficient Coins.");await changeCoins(env,u.id,-amount,"TRANSFER_OUT","give");await changeCoins(env,target.id,amount,"TRANSFER_IN","give");return send(env,chatId,`🎁 Sent *${amount}* Damper Coins to ${target.username?`@${target.username}`:`ID ${target.damper_id}`}.`);}
  if(c==="/coin")return wagerGame(env,chatId,u,"COIN_FLIP",parseStake(text),()=>Math.random()<.5?{mult:1.9,outcome:"WIN",xp:8,text:"🪙 *COIN FLIP*\n\nThe coin landed in your favor!"}:{mult:0,outcome:"LOSS",xp:2,text:"🪙 *COIN FLIP*\n\nThe coin went the other way."});
  if(c==="/dice")return wagerGame(env,chatId,u,"DICE_DUEL",parseStake(text),()=>{const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);return a>b?{mult:1.8,outcome:"WIN",xp:12,text:`🎲 *DICE DUEL*\n\nYou: ${a}  •  Bot: ${b}\nYou win!`}:a===b?{mult:1,outcome:"DRAW",xp:5,text:`🎲 *DICE DUEL*\n\nYou: ${a}  •  Bot: ${b}\nDraw — stake returned.`}:{mult:0,outcome:"LOSS",xp:3,text:`🎲 *DICE DUEL*\n\nYou: ${a}  •  Bot: ${b}\nYou lose.`};});
  if(c==="/penalty"){const a=text.split(/\s+/);const dir=a[1];const stake=parseStake(text);if(!["left","right","center","top-left","top-right"].includes(dir))return send(env,chatId,"Usage: /penalty left 50\nDirections: left, right, center, top-left, top-right");return wagerGame(env,chatId,u,"PENALTY",stake,()=>{const save=Math.random()<.35;if(save)return{mult:0,outcome:"LOSS",xp:2,text:`⚽ *PENALTY*\n\nKeeper saved the shot.`};const mult=dir==="center"?1.4:(dir==="left"||dir==="right")?2:3;return{mult,outcome:"WIN",xp:10,text:`⚽ *GOAL!*\n\nShot direction: ${dir}`};});}
  if(c==="/ping")return send(env,chatId,"🏓 pong");
  if(c==="/help")return send(env,chatId,"❓ *HELP*\n\n/menu • /profile • /balance • /daily • /give\n/games • /coin 50 • /dice 50 • /penalty left 50\n/shop • /vault • /leaderboard • /stats");
  return null;
}

async function callback(env,q){const chatId=q.message?.chat?.id,userId=q.from?.id,data=q.data;if(!chatId)return ack(env,q.id);
  if(data==="check_membership"){const ok=await access(env,q.from);await ack(env,q.id,ok?"Membership verified!":"Join both channels first.");if(!ok)return edit(env,chatId,q.message.message_id,"🔒 *ACCESS LOCKED*\n\nJoin both official channels, then check again.",joinKeyboard());const u=await ensureAccount(env,q.from);return photo(env,chatId,`🔥 *THE DAMPER_BOT V2*\n\n\`SYSTEM ONLINE\`\n\n🆔 \`${u.damper_id}\`\n💰 ${u.balance} Damper Coins\n⭐ Level ${u.level}\n\n*ACCOUNT READY*`,mainKeyboard());}
  await ack(env,q.id);
  const pages={menu_games:["🎮 *GAMES*\n\nMinimum wager: 50 Damper Coins.",gameKeyboard()],menu_economy:["💰 *ECONOMY*\n\nBalance, Daily, Transfers and stats.",economyKeyboard()],menu_rpg:["⚔️ *RPG*\n\nBattle → Earn XP → Level Up → Equip.",back()],menu_shop:["🛒 *SHOP*\n\nCards, Pets and Numbered Items.",shopKeyboard()],menu_vault:["🗃️ *VAULT*\n\nYour collections, achievements, titles and RPG inventory.",vaultKeyboard()],menu_leaderboard:["📊 *LEADERBOARD*\n\nUse /leaderboard for the richest list.",back()],menu_profile:["👤 *PROFILE*\n\nUse /profile for your full profile.",back()],menu_help:["❓ *HELP*\n\nUse /help for commands.",back()]};
  if(data==="menu_main")return edit(env,chatId,q.message.message_id,"🔥 *THE DAMPER_BOT V2*\n\nChoose your destination.",mainKeyboard());
  if(pages[data])return edit(env,chatId,q.message.message_id,pages[data][0],pages[data][1]);
  const u=await getUser(env,userId);if(!u)return;
  if(data==="eco_balance")return edit(env,chatId,q.message.message_id,`💰 *BALANCE*\n\n🪙 ${u.balance} Damper Coins`,economyKeyboard());
  if(data==="eco_daily")return daily(env,chatId,u);
  if(data==="eco_stats")return stats(env,chatId,u);
  if(data==="game_coin")return send(env,chatId,"🪙 Use `/coin 50` (minimum 50).",gameKeyboard());
  if(data==="game_dice")return send(env,chatId,"🎲 Use `/dice 50` (minimum 50).",gameKeyboard());
  if(data==="game_penalty")return send(env,chatId,"⚽ Use `/penalty left 50` — or right, center, top-left, top-right.",gameKeyboard());
  if(data==="game_mines")return send(env,chatId,"💣 Mines engine is next in the game rollout. Minimum wager: 50.",gameKeyboard());
  if(data==="game_slots")return send(env,chatId,"🎰 Slots engine is next in the game rollout. Minimum wager: 50.",gameKeyboard());
  if(data==="game_race")return send(env,chatId,"🏁 Race engine is next in the game rollout. Minimum wager: 50.",gameKeyboard());
  if(data==="game_brain")return send(env,chatId,"🧠 Brain bank is being wired in. Trivia, math, anagram, emoji and flags are planned.",gameKeyboard());
  if(data==="game_reaction")return send(env,chatId,"⚡ Reaction games are being wired in. Fastest, Type Challenge and Reaction Test are planned.",gameKeyboard());
  if(data.startsWith("shop_"))return send(env,chatId,"🛒 Shop inventory is being wired into the persistent Vault. No purchase has been charged by this button.",shopKeyboard());
  if(data.startsWith("vault_"))return send(env,chatId,"🗃️ Vault collection views are being wired into the persistent collection tables.",vaultKeyboard());
}

export default {async fetch(request,env){try{const url=new URL(request.url);if(url.pathname==="/"){const r=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();return new Response(JSON.stringify({status:"online",database:"connected",telegram:!!env.TELEGRAM_BOT_TOKEN,tables:r.results}),{headers:{"content-type":"application/json"}});}if(url.pathname!=="/telegram/webhook")return new Response("OK");if(request.method!=="POST")return new Response("Method Not Allowed",{status:405});const update=await request.json();if(update.callback_query){await callback(env,update.callback_query);return new Response("OK");}const msg=update.message;if(msg?.chat?.id&&msg?.text){const text=msg.text.trim();if(text==="/start"){const ok=await access(env,msg.from);if(!ok)return send(env,msg.chat.id,"🔒 *WELCOME TO THE DAMPER_BOT V2*\n\nJoin both official channels below, then press *CHECK MEMBERSHIP*.",joinKeyboard());const u=await ensureAccount(env,msg.from);return photo(env,msg.chat.id,`🔥 *THE DAMPER_BOT V2*\n\n\`SYSTEM ONLINE\`\n\n🆔 \`${u.damper_id}\`\n💰 ${u.balance} Damper Coins\n⭐ Level ${u.level}\n\n*ACCOUNT READY*\n\nUse /menu to enter.`,mainKeyboard());}const ok=await access(env,msg.from);if(!ok)return send(env,msg.chat.id,"🔒 Join both official channels first, then use /start.",joinKeyboard());await command(env,msg,text);}return new Response("OK");}catch(e){console.error(e);return new Response("OK");}}};
