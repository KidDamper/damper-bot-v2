import base from './entrypoint.js';
import { socialMenu, socialPrompt } from './games/social-ui.js';
import { startReactionTest, resolveReactionTest } from './games/reaction-service.js';

const MEME='@nah_idmeme';
const UPDATES='@Updamper_bot';

async function tg(env,method,body){
  const r=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  return r.json();
}
const edit=(env,chat_id,message_id,text,reply_markup)=>tg(env,'editMessageText',{chat_id,message_id,text,parse_mode:'Markdown',...(reply_markup?{reply_markup}:{})});
const send=(env,chat_id,text,reply_markup)=>tg(env,'sendMessage',{chat_id,text,parse_mode:'Markdown',...(reply_markup?{reply_markup}:{})});
const ack=(env,id,text='')=>tg(env,'answerCallbackQuery',{callback_query_id:id,text});
const join=()=>({inline_keyboard:[[{text:'🧠 JOIN MEME CHANNEL',url:'https://t.me/nah_idmeme'}],[{text:'🔥 JOIN UPDATES CHANNEL',url:'https://t.me/Updamper_bot'}],[{text:'✅ CHECK MEMBERSHIP',callback_data:'check_membership'}]]});

async function member(env,ch,id){
  const r=await tg(env,'getChatMember',{chat_id:ch,user_id:id});
  return !!(r.ok&&['creator','administrator','member'].includes(r.result?.status));
}
async function allowed(env,id){
  if(env.OWNER_TELEGRAM_ID&&String(env.OWNER_TELEGRAM_ID)===String(id))return true;
  return member(env,MEME,id)&&member(env,UPDATES,id);
}

const back=()=>({inline_keyboard:[[{text:'⬅️ BACK',callback_data:'menu_games'}]]});
const reactionMenu=()=>({text:'⚡ *REACTION GAMES*\n\nFast, simple and no wager required.',reply_markup:{inline_keyboard:[[{text:'⚡ REACTION TEST',callback_data:'safe_reaction_test'}],[{text:'⬅️ BACK',callback_data:'menu_games'}]]}});
const socialView=()=>socialMenu();

async function safeCallback(env,q){
  const d=String(q.data||'');
  const supported=d==='games_social'||d==='games_reaction'||d.startsWith('safe_')||d.startsWith('social_');
  if(!supported)return false;
  await ack(env,q.id);
  const chat=q.message?.chat?.id,mid=q.message?.message_id;
  if(!(await allowed(env,q.from.id)))return edit(env,chat,mid,'🔒 *ACCESS LOCKED*\n\nJoin both channels, then check membership.',join());

  if(d==='games_social'||d==='social_main'){
    const view=socialView();
    return edit(env,chat,mid,view.text,view.reply_markup);
  }
  if(d==='games_reaction')return edit(env,chat,mid,...Object.values(reactionMenu()));
  if(d==='social_truth'||d==='social_dare'||d==='social_random'){
    const r=socialPrompt(d.slice(7),[]);
    return edit(env,chat,mid,`🎭 *${r.type}*\n\n${r.prompt}`,{inline_keyboard:[[{text:'🔄 AGAIN',callback_data:d}],[{text:'⬅️ SOCIAL',callback_data:'social_main'}]]});
  }
  if(d==='social_hotseat'){
    return edit(env,chat,mid,'🔥 *HOT SEAT*\n\nAdd at least two players in the group, then use the group game flow.',{inline_keyboard:[[{text:'⬅️ SOCIAL',callback_data:'social_main'}]]});
  }
  if(d==='social_impostor'){
    return edit(env,chat,mid,'🕵️ *IMPOSTOR*\n\nThis mode needs at least 3 players. Group-player tracking will be wired separately.',{inline_keyboard:[[{text:'⬅️ SOCIAL',callback_data:'social_main'}]]});
  }
  if(d==='safe_reaction_test'){
    const round=startReactionTest(Date.now());
    const id=`${Date.now()}_${round.goAt}`;
    return edit(env,chat,mid,'⚡ *REACTION TEST*\n\nWait for the GO button, then tap it as quickly as you can.',{inline_keyboard:[[{text:'🟢 GO!',callback_data:`safe_reaction_go:${id}:${round.goAt}`}],[{text:'❌ CANCEL',callback_data:'games_reaction'}]]});
  }
  if(d.startsWith('safe_reaction_go:')){
    const [,id,goAt]=d.split(':');
    const start={goAt:Number(goAt)};
    const result=resolveReactionTest(start,Date.now(),false);
    if(!result.ok)return send(env,chat,'⌛ Reaction round expired.',back());
    return edit(env,chat,mid,`⚡ *REACTION TEST*\n\n⏱️ ${result.ms} ms\n\nNo wager — just speed.`,back());
  }
  return false;
}

export default {
  async fetch(request,env,ctx){
    if(request.method==='POST'&&new URL(request.url).pathname==='/telegram/webhook'){
      const clone=request.clone();
      try{
        const update=await clone.json();
        if(update.callback_query){
          const handled=await safeCallback(env,update.callback_query);
          if(handled!==false)return new Response('OK');
        }
      }catch(e){console.error('safe wrapper callback error',e);}
    }
    return base.fetch(request,env,ctx);
  }
};
