
const V="clean-reset-001",OWNER="7852229418",OWNER_DID="001",MIN=50;
const BANNER="AgACAgQAAxkBAAMIaqrLcsPcHMx7oPIUstU4FEnr7UYAAuEYaxsFs1lRZUeHg_eeON4BAAMCAAN5AAM9BA";
const MEME="@nah_idmeme",UPDATES="@Updamper_bot",now=()=>Math.floor(Date.now()/1000);

async function tg(e,m,b){const r=await fetch("https://api.telegram.org/bot"+e.TELEGRAM_BOT_TOKEN+"/"+m,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)});return r.json();}
const send=(e,c,t,k)=>tg(e,"sendMessage",{chat_id:c,text:t,parse_mode:"Markdown",...(k?{reply_markup:k}:{})});
const edit=(e,c,m,t,k)=>tg(e,"editMessageText",{chat_id:c,message_id:m,text:t,parse_mode:"Markdown",...(k?{reply_markup:k}:{})});
const photo=(e,c,t,k)=>tg(e,"sendPhoto",{chat_id:c,photo:BANNER,caption:t,parse_mode:"Markdown",reply_markup:k});
const ack=(e,id)=>tg(e,"answerCallbackQuery",{callback_query_id:id});
const back=(d="menu")=>({inline_keyboard:[[{text:"⬅️ BACK",callback_data:d}]]});
const main=()=>({inline_keyboard:[[{text:"🎮 GAMES",callback_data:"games"},{text:"👤 PROFILE",callback_data:"profile"}],[{text:"💰 BALANCE",callback_data:"balance"},{text:"ℹ️ HELP",callback_data:"help"}]]});
const games=()=>({inline_keyboard:[[{text:"🎲 DICE DUEL",callback_data:"dice"}],[{text:"⬅️ BACK",callback_data:"menu"}]]});
const stakes=()=>({inline_keyboard:[[{text:"🪙 50",callback_data:"stake:50"},{text:"🪙 100",callback_data:"stake:100"}],[{text:"🪙 250",callback_data:"stake:250"}],[{text:"⬅️ GAMES",callback_data:"games"}]]});
const join=()=>({inline_keyboard:[[{text:"🧠 JOIN MEME",url:"https://t.me/nah_idmeme"}],[{text:"🔥 JOIN UPDATES",url:"https://t.me/Updamper_bot"}],[{text:"✅ CHECK",callback_data:"check"}]]});

async function setup(e){
 const d=e.DB;
 await d.batch([
  d.prepare("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,telegram_id TEXT UNIQUE NOT NULL,username TEXT,damper_id TEXT UNIQUE NOT NULL,role TEXT NOT NULL DEFAULT 'PLAYER',created_at INTEGER NOT NULL)"),
  d.prepare("CREATE TABLE IF NOT EXISTS wallets(user_id INTEGER PRIMARY KEY,balance INTEGER NOT NULL DEFAULT 500)"),
  d.prepare("CREATE TABLE IF NOT EXISTS xp(user_id INTEGER PRIMARY KEY,damper_xp INTEGER NOT NULL DEFAULT 0,level INTEGER NOT NULL DEFAULT 1)"),
  d.prepare("CREATE TABLE IF NOT EXISTS clean_wagers(id TEXT PRIMARY KEY,telegram_id TEXT NOT NULL,user_id INTEGER NOT NULL,stake INTEGER NOT NULL,result TEXT,payout INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL)")
 ]);
}
async function user(e,id){return e.DB.prepare("SELECT u.*,COALESCE(w.balance,500) balance,COALESCE(x.level,1) level,COALESCE(x.damper_xp,0) damper_xp FROM users u LEFT JOIN wallets w ON w.user_id=u.id LEFT JOIN xp x ON x.user_id=u.id WHERE u.telegram_id=? LIMIT 1").bind(String(id)).first();}
async function account(e,f){
 const tid=String(f.id);let u=await user(e,tid);
 if(!u){
  let did=null;
  if(tid===OWNER&&!await e.DB.prepare("SELECT id FROM users WHERE damper_id=?").bind(OWNER_DID).first())did=OWNER_DID;
  for(let i=0;!did&&i<100;i++){const n=String(10000+Math.floor(Math.random()*90000));if(!await e.DB.prepare("SELECT id FROM users WHERE damper_id=?").bind(n).first())did=n;}
  if(!did)throw Error("DAMper_ID_ALLOCATION_FAILED");
  await e.DB.prepare("INSERT OR IGNORE INTO users(telegram_id,username,damper_id,role,created_at) VALUES(?,?,?,?,?)").bind(tid,f.username||null,did,tid===OWNER?"OWNER":"PLAYER",now()).run();
  u=await user(e,tid);if(!u)throw Error("ACCOUNT_CREATE_FAILED");
 }
 await e.DB.prepare("INSERT OR IGNORE INTO wallets(user_id,balance) VALUES(?,500)").bind(u.id).run();
 await e.DB.prepare("INSERT OR IGNORE INTO xp(user_id,damper_xp,level) VALUES(?,?,?)").bind(u.id,0,1).run();
 u=await user(e,tid);
 if(!u||String(u.telegram_id)!==tid)throw Error("ACCOUNT_IDENTITY_MISMATCH");
 return u;
}
async function allowed(e,id){
 if(String(id)===OWNER||String(e.OWNER_TELEGRAM_ID||"")===String(id))return true;
 const a=await tg(e,"getChatMember",{chat_id:MEME,user_id:id}),b=await tg(e,"getChatMember",{chat_id:UPDATES,user_id:id});
 const ok=x=>x&&x.ok&&["creator","administrator","member"].includes(x.result&&x.result.status);
 return ok(a)&&ok(b);
}
async function home(e,c,m){const t="🔥 *THE DAMPER_BOT V2*\n\nChoose an option.";return m?edit(e,c,m,t,main()):photo(e,c,t,main());}

async function start(e,u,stake){
 const s=Number(stake);if(!Number.isInteger(s)||s<MIN)throw Error("MINIMUM_STAKE_50");
 const w=await e.DB.prepare("SELECT balance FROM wallets WHERE user_id=?").bind(u.id).first();
 if(Number(w&&w.balance)<s)throw Error("INSUFFICIENT_BALANCE");
 const id="cw_"+crypto.randomUUID().replaceAll("-","").slice(0,14);
 const debit=await e.DB.prepare("UPDATE wallets SET balance=balance-? WHERE user_id=? AND balance>=?").bind(s,u.id,s).run();
 if(Number(debit&&debit.meta&&debit.meta.changes||0)!==1)throw Error("INSUFFICIENT_BALANCE");
 try{
  const made=await e.DB.prepare("INSERT INTO clean_wagers(id,telegram_id,user_id,stake,created_at) VALUES(?,?,?,?,?)").bind(id,String(u.telegram_id),u.id,s,now()).run();
  if(Number(made&&made.meta&&made.meta.changes||0)!==1)throw Error("WAGER_CREATE_FAILED");
 }catch(x){await e.DB.prepare("UPDATE wallets SET balance=balance+? WHERE user_id=?").bind(s,u.id).run();throw x;}
 return id;
}
async function dice(e,c,m,u,id){
 const s=await e.DB.prepare("SELECT * FROM clean_wagers WHERE id=? AND user_id=? AND result IS NULL").bind(id,u.id).first();
 if(!s)return edit(e,c,m,"⌛ *This wager has ended.*",back("games"));
 const you=1+Math.floor(Math.random()*6),bot=1+Math.floor(Math.random()*6);
 const out=you===bot?"DRAW":you>bot?"WIN":"LOSS",payout=Math.floor(s.stake*(out==="WIN"?1.8:out==="DRAW"?1:0));
 const claim=await e.DB.prepare("UPDATE clean_wagers SET result=?,payout=? WHERE id=? AND user_id=? AND result IS NULL").bind(out,payout,id,u.id).run();
 if(Number(claim&&claim.meta&&claim.meta.changes||0)!==1)throw Error("WAGER_ALREADY_SETTLED");
 if(payout)await e.DB.prepare("UPDATE wallets SET balance=balance+? WHERE user_id=?").bind(payout,u.id).run();
 const w=await e.DB.prepare("SELECT balance FROM wallets WHERE user_id=?").bind(u.id).first();
 const h=out==="WIN"?"🏆 *YOU WIN!*":out==="DRAW"?"🤝 *DRAW — STAKE RETURNED*":"❌ *YOU LOSE*";
 return edit(e,c,m,"🎲 *DICE DUEL*\n\nYou: *"+you+"*\nBot: *"+bot+"*\n\n"+h+"\n\n💸 Stake: *"+s.stake+"* Coins\n💰 Payout: *"+payout+"* Coins\n💰 Balance: *"+Number(w&&w.balance||0)+"* Coins",back("games"));
}

async function command(e,x){
 const c=x.chat.id,t=x.text||"";
 if(t==="/ping")return send(e,c,"🏓 Pong! V2 is alive.\nV: "+V);
 if(t==="/start"||t==="/menu"){if(!await allowed(e,x.from.id))return send(e,c,"🔥 *THE DAMPER_BOT V2*\n\nJoin both channels, then check membership.",join());await account(e,x.from);return home(e,c);}
 if(!await allowed(e,x.from.id))return send(e,c,"🔒 *ACCESS LOCKED*\n\nJoin both official channels first.",join());
 const u=await account(e,x.from);
 if(t==="/balance")return send(e,c,"💰 *BALANCE*\n━━━━━━━━━━━━━━\n\n🪙 Coins: *"+u.balance+"*\n⭐ Level: *"+u.level+"*\n✨ XP: *"+u.damper_xp+"*",back());
 if(t==="/profile")return send(e,c,"👤 *PROFILE*\n━━━━━━━━━━━━━━\n\nUsername: *"+(u.username?"@"+u.username:"—")+"*\nDamper ID: *"+u.damper_id+"*\n💰 Coins: *"+u.balance+"*\n⭐ Level: *"+u.level+"*\n✨ XP: *"+u.damper_xp+"*",back());
 return send(e,c,"🤔 Use /menu to open the bot.",back());
}
async function callback(e,q){
 const c=q.message&&q.message.chat&&q.message.chat.id,m=q.message&&q.message.message_id,d=String(q.data||"");await ack(e,q.id);
 if(d==="check"){if(await allowed(e,q.from.id)){await account(e,q.from);return home(e,c,m);}return edit(e,c,m,"❌ *Membership not verified.*",join());}
 if(!await allowed(e,q.from.id))return edit(e,c,m,"🔒 *ACCESS LOCKED*",join());
 const u=await account(e,q.from.id);
 if(d==="menu")return home(e,c,m);
 if(d==="games")return edit(e,c,m,"🎮 *GAMES*\n━━━━━━━━━━━━━━\n\nVirtual Coin games. Minimum wager: *50 Coins*.",games());
 if(d==="balance")return edit(e,c,m,"💰 *BALANCE*\n━━━━━━━━━━━━━━\n\n🪙 Coins: *"+u.balance+"*\n⭐ Level: *"+u.level+"*\n✨ XP: *"+u.damper_xp+"*",back());
 if(d==="profile")return edit(e,c,m,"👤 *PROFILE*\n━━━━━━━━━━━━━━\n\nUsername: *"+(u.username?"@"+u.username:"—")+"*\nDamper ID: *"+u.damper_id+"*\n💰 Coins: *"+u.balance+"*\n⭐ Level: *"+u.level+"*\n✨ XP: *"+u.damper_xp+"*",back());
 if(d==="help")return edit(e,c,m,"ℹ️ *HELP*\n━━━━━━━━━━━━━━\n\n🪙 Damper Coins are virtual only.\n🎮 Minimum wager: 50 Coins.\n\nUse the buttons to navigate.",back());
 if(d==="dice")return edit(e,c,m,"🎲 *DICE DUEL*\n━━━━━━━━━━━━━━\n\nHigher roll wins. Draw returns the stake.\n\nChoose your wager:",stakes());
 if(d.indexOf("stake:")===0){
  const s=Number(d.split(":")[1]);
  try{const id=await start(e,u,s);return dice(e,c,m,u,id);}
  catch(x){return edit(e,c,m,"⚠️ *WAGER NOT STARTED*\n\n"+String(x&&x.message||x).slice(0,100),back("games"));}
 }
 return edit(e,c,m,"⚠️ That button is no longer available.",back());
}
export default {async fetch(request,e){
 try{
  await setup(e);const u=new URL(request.url);
  if(request.method==="GET"&&u.pathname==="/")return Response.json({status:"online",version:V,database:"connected"});
  if(request.method==="POST"&&u.pathname==="/telegram/webhook"){
   const x=await request.json();
   if(x.callback_query){try{await callback(e,x.callback_query);}catch(z){console.error("callback",z);const q=x.callback_query;if(q.message&&q.message.chat)await send(e,q.message.chat.id,"⚠️ *GAME ERROR*\n\n"+String(z&&z.message||z).slice(0,140),back()).catch(()=>{});}}
   else if(x.message)await command(e,x.message);
   return new Response("OK");
  }
  return new Response("OK");
 }catch(x){console.error("worker",x);return new Response("OK");}
}};
