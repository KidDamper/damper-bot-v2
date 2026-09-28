const V="foundation-reset-001",OWNER="7852229418",OWNER_DID="001";
const BANNER="AgACAgQAAxkBAAMIaqrLcsPcHMx7oPIUstU4FEnr7UYAAuEYaxsFs1lRZUeHg_eeON4BAAMCAAN5AAM9BA";
const MEME="@nah_idmeme",UPDATES="@Updamper_bot",RESET="foundation-reset-001",now=()=>Math.floor(Date.now()/1000);

async function tg(e,m,b){
 const r=await fetch("https://api.telegram.org/bot"+e.TELEGRAM_BOT_TOKEN+"/"+m,{
  method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)
 });
 return r.json();
}
const send=(e,c,t,k)=>tg(e,"sendMessage",{chat_id:c,text:t,parse_mode:"Markdown",...(k?{reply_markup:k}:{})});
async function edit(e,c,m,t,k){
 const body={chat_id:c,message_id:m,text:t,parse_mode:"Markdown",...(k?{reply_markup:k}:{})};
 const a=await tg(e,"editMessageText",body);
 if(a&&a.ok)return a;
 const b=await tg(e,"editMessageCaption",{chat_id:c,message_id:m,caption:t,parse_mode:"Markdown",...(k?{reply_markup:k}:{})});
 if(b&&b.ok)return b;
 console.error("edit failed",a,b);
 return b||a;
}
const photo=(e,c,t,k)=>tg(e,"sendPhoto",{chat_id:c,photo:BANNER,caption:t,parse_mode:"Markdown",reply_markup:k});
const ack=(e,id)=>tg(e,"answerCallbackQuery",{callback_query_id:id});
const back=(d="menu")=>({inline_keyboard:[[{text:"⬅️ BACK",callback_data:d}]]});
const main=()=>({inline_keyboard:[
 [{text:"👤 PROFILE",callback_data:"profile"},{text:"💰 BALANCE",callback_data:"balance"}],
 [{text:"ℹ️ HELP",callback_data:"help"}]
]});
const join=()=>({inline_keyboard:[
 [{text:"🧠 JOIN MEME",url:"https://t.me/nah_idmeme"}],
 [{text:"🔥 JOIN UPDATES",url:"https://t.me/Updamper_bot"}],
 [{text:"✅ CHECK",callback_data:"check"}]
]});

async function setup(e){
 const d=e.DB;
 await d.prepare("CREATE TABLE IF NOT EXISTS runtime_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL,created_at INTEGER NOT NULL)").run();
 const meta=await d.prepare("SELECT value FROM runtime_meta WHERE key=? LIMIT 1").bind("schema").first();
 if(!meta||meta.value!==RESET){
  const objects=await d.prepare("SELECT name,type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name<>?").bind("runtime_meta").all();
  const drops=[];
  for(const o of (objects.results||[])){
   const n=String(o.name||"").replaceAll('"','""');
   if(o.type==="view")drops.push(d.prepare('DROP VIEW IF EXISTS "'+n+'"'));
   else if(o.type==="table")drops.push(d.prepare('DROP TABLE IF EXISTS "'+n+'"'));
  }
  if(drops.length)await d.batch(drops);
  await d.batch([
   d.prepare("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,telegram_id TEXT UNIQUE NOT NULL,username TEXT,damper_id TEXT UNIQUE NOT NULL,role TEXT NOT NULL DEFAULT 'PLAYER',balance INTEGER NOT NULL DEFAULT 500,level INTEGER NOT NULL DEFAULT 1,xp INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL)"),
   d.prepare("DELETE FROM runtime_meta"),
   d.prepare("INSERT INTO runtime_meta(key,value,created_at) VALUES(?,?,?)").bind("schema",RESET,now())
  ]);
 }
}

async function user(e,id){
 return e.DB.prepare("SELECT id,telegram_id,username,damper_id,role,balance,level,xp FROM users WHERE telegram_id=? LIMIT 1").bind(String(id)).first();
}

async function account(e,f){
 const tid=String(f.id);
 let u=await user(e,tid);
 if(!u){
  let did=null;
  if(tid===OWNER&&!await e.DB.prepare("SELECT id FROM users WHERE damper_id=?").bind(OWNER_DID).first())did=OWNER_DID;
  for(let i=0;!did&&i<100;i++){
   const n=String(10000+Math.floor(Math.random()*90000));
   if(!await e.DB.prepare("SELECT id FROM users WHERE damper_id=?").bind(n).first())did=n;
  }
  if(!did)throw Error("DAMper_ID_ALLOCATION_FAILED");
  await e.DB.prepare("INSERT OR IGNORE INTO users(telegram_id,username,damper_id,role,balance,level,xp,created_at) VALUES(?,?,?,?,500,1,0,?)").bind(tid,f.username||null,did,tid===OWNER?"OWNER":"PLAYER",now()).run();
  u=await user(e,tid);
  if(!u)throw Error("ACCOUNT_CREATE_FAILED");
 }else if((u.username||null)!==(f.username||null)){
  await e.DB.prepare("UPDATE users SET username=? WHERE telegram_id=?").bind(f.username||null,tid).run();
  u=await user(e,tid);
 }
 if(!u||String(u.telegram_id)!==tid)throw Error("ACCOUNT_IDENTITY_MISMATCH");
 return u;
}

async function allowed(e,id){
 if(String(id)===OWNER||String(e.OWNER_TELEGRAM_ID||"")===String(id))return true;
 const a=await tg(e,"getChatMember",{chat_id:MEME,user_id:id});
 const b=await tg(e,"getChatMember",{chat_id:UPDATES,user_id:id});
 const ok=x=>x&&x.ok&&["creator","administrator","member"].includes(x.result&&x.result.status);
 return ok(a)&&ok(b);
}

async function home(e,c,m,u){
 const t="🔥 *THE DAMPER_BOT V2*\n\n🪪 Damper ID: *"+u.damper_id+"*\n🪙 Coins: *"+u.balance+"*\n⭐ Level: *"+u.level+"*\n\nChoose an option.";
 return m?edit(e,c,m,t,main()):photo(e,c,t,main());
}

function profileText(u){
 return "👤 *PROFILE*\n━━━━━━━━━━━━━━\n\nUsername: *"+(u.username?"@"+u.username:"—")+"*\nDamper ID: *"+u.damper_id+"*\n💰 Coins: *"+u.balance+"*\n⭐ Level: *"+u.level+"*\n✨ XP: *"+u.xp+"*";
}
function balanceText(u){
 return "💰 *BALANCE*\n━━━━━━━━━━━━━━\n\n🪙 Coins: *"+u.balance+"*\n⭐ Level: *"+u.level+"*\n✨ XP: *"+u.xp+"*";
}

async function command(e,x){
 const c=x.chat.id,t=x.text||"";
 if(t==="/ping")return send(e,c,"🏓 Pong! V2 is alive.\nV: "+V);
 if(t==="/start"||t==="/menu"){
  if(!await allowed(e,x.from.id))return send(e,c,"🔥 *THE DAMPER_BOT V2*\n\nJoin both official channels, then check membership.",join());
  return home(e,c,null,await account(e,x.from));
 }
 if(!await allowed(e,x.from.id))return send(e,c,"🔒 *ACCESS LOCKED*\n\nJoin both official channels first.",join());
 const u=await account(e,x.from);
 if(t==="/balance")return send(e,c,balanceText(u),back());
 if(t==="/profile")return send(e,c,profileText(u),back());
 return send(e,c,"🤔 Use /menu to open the bot.",back());
}

async function callback(e,q){
 const c=q.message&&q.message.chat&&q.message.chat.id,m=q.message&&q.message.message_id,d=String(q.data||"");
 await ack(e,q.id);
 if(d==="check"){
  if(await allowed(e,q.from.id))return home(e,c,m,await account(e,q.from));
  return edit(e,c,m,"❌ *Membership not verified.*",join());
 }
 if(!await allowed(e,q.from.id))return edit(e,c,m,"🔒 *ACCESS LOCKED*",join());
 const u=await account(e,q.from);
 if(d==="menu")return home(e,c,m,u);
 if(d==="profile")return edit(e,c,m,profileText(u),back());
 if(d==="balance")return edit(e,c,m,balanceText(u),back());
 if(d==="help")return edit(e,c,m,"ℹ️ *HELP*\n━━━━━━━━━━━━━━\n\n🪙 Damper Coins are virtual only.\n🎮 Games will be added back separately after the core is verified.\n\nUse the buttons to navigate.",back());
 return edit(e,c,m,"⚠️ That button is no longer available.",back());
}

export default {async fetch(request,e){
 try{
  const u=new URL(request.url);
  if(request.method==="GET"&&u.pathname==="/")return Response.json({status:"online",version:V,database:"not-tested"});
  if(request.method==="POST"&&u.pathname==="/telegram/webhook"){
   const x=await request.json();
   // /ping deliberately bypasses D1 so it can diagnose Worker/webhook health even if setup fails.
   if(x.message&&x.message.text==="/ping"){
    await send(e,x.message.chat.id,"🏓 Pong! V2 is alive.\\nV: "+V);
    return new Response("OK");
   }
   await setup(e);
   if(x.callback_query){
    try{await callback(e,x.callback_query);}
    catch(z){
     console.error("callback",z);
     const q=x.callback_query;
     if(q.message&&q.message.chat)await send(e,q.message.chat.id,"⚠️ *CORE ERROR*\n\n"+String(z&&z.message||z).slice(0,140),back()).catch(()=>{});
    }
   }else if(x.message)await command(e,x.message);
   return new Response("OK");
  }
  return new Response("OK");
 }catch(x){
  console.error("worker",x);
  return new Response("OK");
 }
}};
