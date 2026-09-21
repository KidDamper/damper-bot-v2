import base from './entrypoint.js';
import { socialMenu, socialPrompt } from './games/social-ui.js';
import { startReactionTest, resolveReactionTest } from './games/reaction-service.js';
import { nextQuestion, checkBrainAnswer, brainReward } from './games/brain-service.js';
import { MENU_CONFIG } from './ui/menu-config.js';
import { walletBalance, walletChange } from './core/wallet.js';

const BANNER_FILE_ID='AgACAgQAAxkBAAMIaqrLcsPcHMx7oPIUstU4FEnr7UYAAuEYaxsFs1lRZUeHg_eeON4BAAMCAAN5AAM9BA';
const MEME='@nah_idmeme';
const UPDATES='@Updamper_bot';
const now=()=>Math.floor(Date.now()/1000);
async function tg(env,method,body){const r=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return r.json();}
const edit=async(env,chat_id,message_id,text,reply_markup)=>{const r=await tg(env,'editMessageText',{chat_id,message_id,text,parse_mode:'Markdown',...(reply_markup?{reply_markup}:{})});if(r?.ok)return r;await tg(env,'deleteMessage',{chat_id,message_id});return send(env,chat_id,text,reply_markup);};
const send=(env,chat_id,text,reply_markup)=>tg(env,'sendMessage',{chat_id,text,parse_mode:'Markdown',...(reply_markup?{reply_markup}:{})});
const photo=(env,chat_id,caption,reply_markup)=>tg(env,'sendPhoto',{chat_id,photo:BANNER_FILE_ID,caption,parse_mode:'Markdown',...(reply_markup?{reply_markup}:{})});
const ack=(env,id,text='')=>tg(env,'answerCallbackQuery',{callback_query_id:id,text});
const join=()=>({inline_keyboard:[[{text:'🧠 JOIN MEME CHANNEL',url:'https://t.me/nah_idmeme'}],[{text:'🔥 JOIN UPDATES CHANNEL',url:'https://t.me/Updamper_bot'}],[{text:'✅ CHECK MEMBERSHIP',callback_data:'check_membership'}]]});
async function member(env,ch,id){const r=await tg(env,'getChatMember',{chat_id:ch,user_id:id});return !!(r.ok&&['creator','administrator','member'].includes(r.result?.status));}
async function allowed(env,id){if(env.OWNER_TELEGRAM_ID&&String(env.OWNER_TELEGRAM_ID)===String(id))return true;return member(env,MEME,id)&&member(env,UPDATES,id);}
async function user(env,id){const db=env.DB.withSession('first-primary');const u=await db.prepare('SELECT u.*,x.damper_xp,x.level,x.rpg_xp,x.rpg_level FROM users u LEFT JOIN xp x ON x.user_id=u.id WHERE u.telegram_id=?').bind(String(id)).first();if(!u)return u;const w=await db.prepare('SELECT balance FROM wallets WHERE user_id=?').bind(u.id).first();return {...u,balance:Number(w?.balance??0)};}
const mainMenu=()=>({inline_keyboard:(MENU_CONFIG.main||[]).reduce((rows,[text,callback_data],i)=>{if(i%2===0)rows.push([]);rows.at(-1).push({text,callback_data});return rows;},[])});
const gamesMenu=()=>({inline_keyboard:[[{text:'🪙 COIN FLIP',callback_data:'game_coin'},{text:'🎲 DICE DUEL',callback_data:'game_dice'}],[{text:'💣 MINES',callback_data:'game_mines'},{text:'🎰 SLOTS',callback_data:'game_slots'}],[{text:'⚽ PENALTY',callback_data:'game_penalty'},{text:'🏁 VIRTUAL RACE',callback_data:'game_race'}],[{text:'🧠 BRAIN',callback_data:'safe_games_brain'},{text:'⚡ REACTION',callback_data:'games_reaction'}],[{text:'🎭 SOCIAL',callback_data:'games_social'}],[{text:'⬅️ BACK',callback_data:'menu_main'}]]});
const brainMenu=()=>({inline_keyboard:[[{text:'🧠 TRIVIA',callback_data:'safe_brain_trivia'}],[{text:'➗ MATH',callback_data:'safe_brain_math'}],[{text:'🔤 ANAGRAM',callback_data:'safe_brain_anagram'}],[{text:'😀 EMOJI',callback_data:'safe_brain_emoji'}],[{text:'🏳️ FLAGS',callback_data:'safe_brain_flags'}],[{text:'⬅️ BACK',callback_data:'games_main'}]]});
const backGames=()=>({inline_keyboard:[[{text:'⬅️ GAMES',callback_data:'games_main'}]]});
const backMain=()=>({inline_keyboard:[[{text:'⬅️ MENU',callback_data:'menu_main'}]]});
const reactionMenu=()=>({text:'⚡ *REACTION GAMES*\n\nWait for a random GO signal, then tap it as fast as possible.',reply_markup:{inline_keyboard:[[{text:'⚡ REACTION TEST',callback_data:'safe_reaction_test'}],[{text:'⬅️ BACK',callback_data:'games_main'}]]}});
const socialView=()=>socialMenu();
const menuPage=(key,title,body)=>{const rows=(MENU_CONFIG[key]||[]).map(([text,callback_data])=>({text,callback_data}));const grouped=[];for(let i=0;i<rows.length;i+=2)grouped.push(rows.slice(i,i+2));grouped.push([{text:'⬅️ BACK',callback_data:'menu_main'}]);return {text:`*${title}*

${body}`,reply_markup:{inline_keyboard:grouped}};};
async function activeSession(env,userId,types=[]){const placeholders=types.length?`AND game_type IN (${types.map(()=>'?').join(',')})`:'';const binds=[userId,...types,now()];return env.DB.prepare(`SELECT * FROM game_sessions WHERE player_id=? ${placeholders} AND result IS NULL AND expires_at>? ORDER BY created_at DESC LIMIT 1`).bind(...binds).first();}
async function createSafeSession(env,userId,chatId,type,state,ttl=900){const id=`safe_${crypto.randomUUID().replaceAll('-','').slice(0,14)}`;await env.DB.prepare('INSERT INTO game_sessions(id,game_type,chat_id,player_id,state,stake,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,type,String(chatId),userId,JSON.stringify(state),0,now()+ttl,now()).run();return id;}
async function finishSafeSession(env,id,outcome='DONE'){await env.DB.prepare('UPDATE game_sessions SET result=?,reward_applied=1 WHERE id=? AND result IS NULL').bind(JSON.stringify({outcome}),id).run();}
function questionMarkup(q,id){const answers=[...(q.answers||[])];const options=[];for(const a of answers){if(!options.includes(a))options.push(a);}for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}return {inline_keyboard:options.slice(0,4).map((a,i)=>[{text:a,callback_data:`safe_answer:${id}:${i}`}]).concat([[{text:'❌ END',callback_data:`safe_end:${id}`}],[{text:'⬅️ BRAIN',callback_data:'safe_games_brain'}]])};}
async function startBrain(env,chat,mid,userId,category){const q=nextQuestion(category);if(!q)return edit(env,chat,mid,'⚠️ No question is available in this category yet.',brainMenu());const id=await createSafeSession(env,userId,chat,'SAFE_BRAIN',{category,question:q});return edit(env,chat,mid,`🧠 *${category.toUpperCase()}*

${q.question}

*Difficulty:* ${q.difficulty}`,questionMarkup(q,id));}
async function handleSafeMessage(env,msg){if(!msg?.text||msg.text.startsWith('/'))return false;if(!(await allowed(env,msg.from.id)))return false;const u=await user(env,msg.from.id);if(!u)return false;const s=await activeSession(env,u.id,['SAFE_BRAIN','SOCIAL_TRUTH','SOCIAL_DARE','SOCIAL_RANDOM','SOCIAL_HOTSEAT','SOCIAL_IMPOSTOR']);if(!s)return false;const state=JSON.parse(s.state||'{}');
  if(s.game_type==='SAFE_BRAIN'){const correct=checkBrainAnswer(state.question,msg.text);const reward=brainReward(state.question,correct);if(reward.coins)await walletChange(env,u.id,reward.coins);await finishSafeSession(env,s.id,correct?'WIN':'LOSS');const next=nextQuestion(state.category);if(!next)return send(env,msg.chat.id,`${correct?'✅ Correct!':'❌ Not quite.'}${state.question.explanation?`

💡 ${state.question.explanation}`:''}

💰 +${reward.coins} Coins
✨ +${reward.xp} XP`,brainMenu());const id=await createSafeSession(env,u.id,msg.chat.id,'SAFE_BRAIN',{category:state.category,question:next});return send(env,msg.chat.id,`${correct?'✅ Correct!':'❌ Not quite.'}${state.question.explanation?`

💡 ${state.question.explanation}`:''}

💰 +${reward.coins} Coins
✨ +${reward.xp} XP

🧠 *Next question*

${next.question}`,questionMarkup(next,id));}
  if(s.game_type.startsWith('SOCIAL_')){await finishSafeSession(env,s.id,'ANSWERED');const mode=state.mode||'random';const r=socialPrompt(mode,[]);const id=await createSafeSession(env,u.id,msg.chat.id,`SOCIAL_${mode.toUpperCase()}`,{mode,prompt:r.prompt});return send(env,msg.chat.id,`✅ *Response received.*

🎭 *${r.type}*

${r.prompt}`,{inline_keyboard:[[{text:'🔄 NEW',callback_data:`social_${mode}`}],[{text:'⬅️ SOCIAL',callback_data:'games_social'}]]});}
  return false;
}
async function safeCallback(env,q){
  const d=String(q.data||'');
  const supported=d==='check_membership'||d==='menu_main'||d==='menu_games'||d==='games_main'||d==='games_social'||d==='games_reaction'||d==='safe_games_brain'||d.startsWith('safe_')||d.startsWith('social_')||d.startsWith('vault_')||d==='leaderboard_main'||d.startsWith('leaderboard:')||['economy_main','economy_balance','economy_daily','economy_give','rpg_main','profile_main','help_main','help_commands','help_games','help_economy','help_rpg'].includes(d);
  if(!supported)return false;
  await ack(env,q.id);const chat=q.message?.chat?.id,mid=q.message?.message_id;
  if(!(await allowed(env,q.from.id)))return edit(env,chat,mid,'🔒 *ACCESS LOCKED*\n\nJoin both channels, then check membership.',join());

  if(d==='check_membership'){const ok=await allowed(env,q.from.id);return ok?edit(env,chat,mid,'✅ *MEMBERSHIP VERIFIED*\n\nChoose your destination.',mainMenu()):edit(env,chat,mid,'❌ Join both channels first.',join());}
  if(d==='menu_main'){await tg(env,'deleteMessage',{chat_id:chat,message_id:mid});return photo(env,chat,'🔥 *THE DAMPER_BOT V2*',mainMenu());}
  if(d==='games_main'||d==='menu_games')return edit(env,chat,mid,'🎮 *GAMES*\n━━━━━━━━━━━━━━\n\n🪙 *WAGER GAMES*\nVirtual Coin wager games with a minimum stake of 50 Coins.\n\n🧠 *NON-WAGER GAMES*\nBrain, Reaction and Social games use no stake.',gamesMenu());
  if(d==='safe_games_brain')return edit(env,chat,mid,'🧠 *BRAIN GAMES*\n\nChoose a challenge.',brainMenu());
  if(d==='rpg_main')return edit(env,chat,mid,'⚔️ *RPG*\n━━━━━━━━━━━━━━\n\n⚔️ *BATTLE*\nFight and earn RPG rewards.\n\n⬆️ *PROGRESSION*\nLevel up and improve your stats.\n\n🎒 *INVENTORY*\nManage your RPG equipment.',{inline_keyboard:[[{text:'⚔️ BATTLE',callback_data:'rpg_start'}],[{text:'⬆️ LEVEL UP',callback_data:'rpg_levelup'},{text:'🎒 INVENTORY',callback_data:'rpg_inv'}],[{text:'📊 RPG PROFILE',callback_data:'rpg_prof'}],[{text:'⬅️ BACK',callback_data:'menu_main'}]]});
  if(d==='vault_main')return edit(env,chat,mid,'🗃️ *VAULT*\n━━━━━━━━━━━━━━\n\nYour collection of cards, pets, numbered items, achievements and RPG gear.',{inline_keyboard:[[{text:'🃏 CARDS',callback_data:'vault_cards'},{text:'🐾 PETS',callback_data:'vault_pets'}],[{text:'🔢 NUMBERED ITEMS',callback_data:'vault_numbered'}],[{text:'⚔️ RPG GEAR',callback_data:'vault_rpg'}],[{text:'🏆 ACHIEVEMENTS',callback_data:'vault_achievements'},{text:'🏅 TITLES',callback_data:'vault_titles'}],[{text:'⬅️ BACK',callback_data:'menu_main'}]]});
  if(d==='leaderboard_main')return edit(env,chat,mid,'📊 *LEADERBOARD*\n━━━━━━━━━━━━━━\n\nCompare Coins, XP, wins, games, RPG progress and collections.',{inline_keyboard:[[{text:'💰 RICHEST',callback_data:'leaderboard:coins'},{text:'⭐ XP',callback_data:'leaderboard:xp'}],[{text:'🏆 WINS',callback_data:'leaderboard:wins'},{text:'🎮 GAMES',callback_data:'leaderboard:games'}],[{text:'⚔️ RPG',callback_data:'leaderboard:rpg'},{text:'🃏 COLLECTOR',callback_data:'leaderboard:collector'}],[{text:'🏅 ACHIEVEMENTS',callback_data:'leaderboard:achievements'}],[{text:'⬅️ BACK',callback_data:'menu_main'}]]});
  const u=await user(env,q.from.id);if(!u)return send(env,chat,'⚠️ Account not ready. Use /start first.');
  if(d==='games_social'||d==='social_main'){const view=socialView();return edit(env,chat,mid,view.text,view.reply_markup);}
  if(d==='games_reaction')return edit(env,chat,mid,reactionMenu().text,reactionMenu().reply_markup);
  if(d.startsWith('safe_brain_'))return startBrain(env,chat,mid,u.id,d.slice(11));
  if(d.startsWith('safe_answer:')){const [,sid,raw]=d.split(':');const s=await env.DB.prepare('SELECT * FROM game_sessions WHERE id=? AND player_id=? AND result IS NULL').bind(sid,u.id).first();if(!s)return send(env,chat,'⌛ This question has ended.');const state=JSON.parse(s.state||'{}');const answer=(state.question.answers||[])[Number(raw)];if(answer===undefined)return send(env,chat,'⚠️ That answer button is no longer valid.',brainMenu());const correct=checkBrainAnswer(state.question,answer);const reward=brainReward(state.question,correct);if(reward.coins)await walletChange(env,u.id,reward.coins);await finishSafeSession(env,sid,correct?'WIN':'LOSS');const next=nextQuestion(state.category);if(!next)return edit(env,chat,mid,`${correct?'✅ Correct!':'❌ Not quite.'}

${state.question.explanation||''}

💰 +${reward.coins} Coins
✨ +${reward.xp} XP`,brainMenu());const nid=await createSafeSession(env,u.id,chat,'SAFE_BRAIN',{category:state.category,question:next});return edit(env,chat,mid,`${correct?'✅ Correct!':'❌ Not quite.'}

${state.question.explanation||''}

💰 +${reward.coins} Coins
✨ +${reward.xp} XP

🧠 *Next question*

${next.question}`,questionMarkup(next,nid));}
  if(d.startsWith('safe_end:')){const id=d.split(':')[1];const s=await env.DB.prepare('SELECT id FROM game_sessions WHERE id=? AND player_id=? AND result IS NULL').bind(id,u.id).first();if(!s)return send(env,chat,'⌛ This question has ended.',backGames());await finishSafeSession(env,id,'ENDED');return edit(env,chat,mid,'🧠 Game ended.',brainMenu());}
  if(d==='social_truth'||d==='social_dare'||d==='social_random'){const mode=d.slice(7);const r=socialPrompt(mode,[]);const id=await createSafeSession(env,u.id,chat,`SOCIAL_${mode.toUpperCase()}`,{mode,prompt:r.prompt});return edit(env,chat,mid,`🎭 *${r.type}*

${r.prompt}

*Reply to this message with your answer.*`,{inline_keyboard:[[{text:'🔄 AGAIN',callback_data:d}],[{text:'⬅️ SOCIAL',callback_data:'games_social'}]]});}
  if(d==='social_hotseat'){await createSafeSession(env,u.id,chat,'SOCIAL_HOTSEAT',{mode:'random'});return edit(env,chat,mid,'🔥 *HOT SEAT*\n\nThe current player can reply with their answer.\n\n*Reply to this message to continue.*',{inline_keyboard:[[{text:'⬅️ SOCIAL',callback_data:'games_social'}]]});}
  if(d==='social_impostor'){await createSafeSession(env,u.id,chat,'SOCIAL_IMPOSTOR',{mode:'random'});return edit(env,chat,mid,'🕵️ *IMPOSTOR*\n\nPlayer response mode is active.\n\n*Reply to this message to continue.*',{inline_keyboard:[[{text:'⬅️ SOCIAL',callback_data:'games_social'}]]});}
  if(d==='safe_reaction_test'){const round=startReactionTest(Date.now());const id=await createSafeSession(env,u.id,chat,'SAFE_REACTION',{goAt:round.goAt});await edit(env,chat,mid,'⚡ *REACTION TEST*\n\nWait for the signal…',{inline_keyboard:[[{text:'❌ CANCEL',callback_data:`safe_reaction_cancel:${id}`}]]});await new Promise(r=>setTimeout(r,Math.max(1200,round.delay)));const current=await env.DB.prepare('SELECT result,state FROM game_sessions WHERE id=? AND player_id=?').bind(id,u.id).first();if(current?.result)return new Response('');return edit(env,chat,mid,'⚡ *REACTION TEST*\n\n🟢 *GO!* TAP NOW!',{inline_keyboard:[[{text:'🟢 TAP!',callback_data:`safe_reaction_go:${id}`}],[{text:'❌ CANCEL',callback_data:`safe_reaction_cancel:${id}`}]]});}
  if(d.startsWith('safe_reaction_go:')){const id=d.split(':')[1];const s=await env.DB.prepare('SELECT * FROM game_sessions WHERE id=? AND player_id=? AND result IS NULL').bind(id,u.id).first();if(!s)return send(env,chat,'⌛ Reaction test ended.');const state=JSON.parse(s.state||'{}');const result=resolveReactionTest({goAt:Number(state.goAt)},Date.now(),false);await finishSafeSession(env,id,'DONE');return edit(env,chat,mid,`⚡ *REACTION TEST*

⏱️ *${result.ms} ms*

Nice reaction.`,backGames());}
  if(d.startsWith('safe_reaction_cancel:')){const id=d.split(':')[1];const s=await env.DB.prepare('SELECT id FROM game_sessions WHERE id=? AND player_id=? AND result IS NULL').bind(id,u.id).first();if(!s)return send(env,chat,'⌛ Reaction test ended.',backGames());await finishSafeSession(env,id,'CANCELLED');return edit(env,chat,mid,'⚡ Reaction test cancelled.',reactionMenu().reply_markup);}
  if(d==='economy_main')return edit(env,chat,mid,'💰 *ECONOMY*\n━━━━━━━━━━━━━━\n\n🪙 *COINS*\nManage your virtual Damper Coins.\n\n⭐ *PROGRESSION*\nTrack your Level and XP.\n\n🎁 *REWARDS*\nClaim Daily Coins and use Give to transfer Coins.',menuPage('economy','ECONOMY','Choose an economy feature below.').reply_markup);
  if(d==='economy_balance'){const db=env.DB.withSession('first-primary');const check=await db.prepare('SELECT u.id AS user_id,u.telegram_id,w.user_id AS wallet_user_id,w.balance FROM users u LEFT JOIN wallets w ON w.user_id=u.id WHERE u.telegram_id=?').bind(String(q.from.id)).run();const row=check.results?.[0]||{};const xpRow=await db.prepare('SELECT damper_xp,level FROM xp WHERE user_id=?').bind(u.id).first();const balance=Number(row.balance??0);const debug='\n\n🔧 *SYNC*\nUSER ID: '+String(row.user_id??'missing')+' • WALLET ID: '+String(row.wallet_user_id??'missing')+' • DB: '+(check.meta?.served_by_primary??'unknown')+' • REGION: '+(check.meta?.served_by_region??'unknown')+' • V: wallet-diag-20260921';return edit(env,chat,mid,'💰 *BALANCE*\n━━━━━━━━━━━━━━\n\n🪙 *Coins*\n'+balance+'\n\n⭐ *Level*\n'+(xpRow?.level||1)+'\n\n✨ *XP*\n'+(xpRow?.damper_xp||0)+debug,backMain());}
  if(d==='economy_daily')return edit(env,chat,mid,'🎁 *DAILY*\n\nUse /daily to claim your daily Coins.',backMain());
  if(d==='economy_give')return edit(env,chat,mid,'💸 *GIVE*\n\nUse /give @username amount to transfer virtual Coins.',backMain());
  if(d==='vault_cards'||d==='vault_pets'||d==='vault_numbered'||d==='vault_rpg'){
    const {getVault}=await import('./vault/vault.js'); const v=await getVault(env,u.id);
    if(d==='vault_cards')return edit(env,chat,mid,v.cards.length?('🃏 *CARDS*\n\n'+v.cards.map(x=>'• '+x.name+' — ×'+x.quantity).join('\n')):'🃏 *CARDS*\n\nNone yet.',{inline_keyboard:[[{text:'⬅️ VAULT',callback_data:'vault_main'}]]});
    if(d==='vault_pets')return edit(env,chat,mid,v.pets.length?('🐾 *PETS*\n\n'+v.pets.map(x=>'• '+x.name+' — '+x.tier+' — Luck +'+(x.luck||0)).join('\n')):'🐾 *PETS*\n\nNone yet.',{inline_keyboard:[[{text:'⬅️ VAULT',callback_data:'vault_main'}]]});
    if(d==='vault_numbered')return edit(env,chat,mid,v.numbered.length?('🔢 *NUMBERED ITEMS*\n\n'+v.numbered.map(x=>'• #'+String(x.id).padStart(2,'0')+' '+x.name).join('\n')):'🔢 *NUMBERED ITEMS*\n\nNone discovered yet.',{inline_keyboard:[[{text:'⬅️ VAULT',callback_data:'vault_main'}]]});
    return edit(env,chat,mid,v.rpg.length?('⚔️ *RPG INVENTORY*\n\n'+v.rpg.map(x=>'• '+x.item_id+' ×'+x.quantity).join('\n')):'⚔️ *RPG INVENTORY*\n\nEmpty.',{inline_keyboard:[[{text:'⬅️ VAULT',callback_data:'vault_main'}]]});
  }
  if(d==='vault_achievements'){
    const {achievementSummary,formatAchievements}=await import('./achievements/format.js');
    const s=await achievementSummary(env,u.id);
    return edit(env,chat,mid,formatAchievements(s),{inline_keyboard:[[{text:'⬅️ VAULT',callback_data:'vault_main'}]]});
  }
  if(d==='vault_titles'){
    const rows=await env.DB.prepare('SELECT t.id,t.name,t.description,CASE WHEN ut.user_id IS NULL THEN 0 ELSE 1 END unlocked FROM titles t LEFT JOIN user_titles ut ON ut.title_id=t.id AND ut.user_id=? ORDER BY unlocked DESC,t.name').bind(u.id).all();
    const titleText=(rows.results||[]).length
      ? '🏅 *TITLES*\n\n'+rows.results.map(x=>Number(x.unlocked)===1?'✅ '+x.name+' — '+x.description:'🔒 '+x.name).join('\n')
      : '🏅 *TITLES*\n\nNo titles configured yet.';
    return edit(env,chat,mid,titleText,{inline_keyboard:[[{text:'⬅️ VAULT',callback_data:'vault_main'}]]});
  }
  if(d.startsWith('leaderboard:')){
    const metric=d.split(':')[1], titles={coins:'RICHEST',xp:'XP',wins:'WINS',games:'GAMES',rpg:'RPG',collector:'COLLECTOR',achievements:'ACHIEVEMENTS'};
    const {leaderboard,formatLeaderboard}=await import('./leaderboards/service.js');
    const rows=await leaderboard(env,metric,10);
    return edit(env,chat,mid,formatLeaderboard(rows,titles[metric]||'LEADERBOARD'),{inline_keyboard:[[{text:'⬅️ LEADERBOARD',callback_data:'leaderboard_main'}]]});
  }
  if(d==='profile_main')return edit(env,chat,mid,`👤 *PROFILE*

Username: ${u.username?`@${u.username}`:'—'}
🆔 Damper ID: \`${u.damper_id}\`
💰 Coins: ${u.balance||0}
⭐ Level: ${u.level||1}
✨ XP: ${u.damper_xp||0}${u.role==='OWNER'?"\n\n👑 CREATOR":""}`,backMain());
  if(d==='help_main')return edit(env,chat,mid,'❓ *HELP*\n━━━━━━━━━━━━━━\n\nFind commands, games, economy and RPG information below.',menuPage('help','HELP','Choose a help section below.').reply_markup);
  if(d==='help_commands')return edit(env,chat,mid,'📖 *COMMANDS*\n\n/start — open the bot\n/menu — main menu\n/balance — view Coins\n/profile — view profile\n/daily — daily reward\n/give @username amount — transfer virtual Coins\n/ping — check bot status',backMain());
  if(d==='help_games')return edit(env,chat,mid,'🎮 *GAMES*\n\nBrain, Reaction and Social games are available without wagers.',gamesMenu());
  if(d==='help_economy')return edit(env,chat,mid,'💰 *ECONOMY*\n\nDamper Coins are virtual. Use Balance, Daily and Give from the Economy menu.',menuPage('economy','ECONOMY','Manage your Coins, daily reward and transfers.').reply_markup);
  if(d==='help_rpg')return edit(env,chat,mid,'⚔️ *RPG*\n\nBattle, level up, inspect inventory and view your RPG profile.',{inline_keyboard:[[{text:'⚔️ OPEN RPG',callback_data:'rpg_main'}],[{text:'⬅️ HELP',callback_data:'help_main'}]]});
  return false;
}
export default {async fetch(request,env,ctx){if(request.method==='POST'&&new URL(request.url).pathname==='/telegram/webhook'){const clone=request.clone();try{const update=await clone.json();if(update.message?.text?.trim().split(/\\s+/)[0].toLowerCase()==='/menu'){await photo(env,update.message.chat.id,'🔥 *THE DAMPER_BOT V2*',mainMenu());return new Response('OK');}if(update.message){const handled=await handleSafeMessage(env,update.message);if(handled!==false)return new Response('OK');}if(update.callback_query){const handled=await safeCallback(env,update.callback_query);if(handled!==false)return new Response('OK');}}catch(e){console.error('safe wrapper error',e);}}return base.fetch(request,env,ctx);}};