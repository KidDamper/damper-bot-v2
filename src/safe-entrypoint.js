import base from './entrypoint.js';
import { socialMenu, socialPrompt } from './games/social-ui.js';
import { startReactionTest, resolveReactionTest } from './games/reaction-service.js';
import { MENU_CONFIG } from './ui/menu-config.js';

const MEME='@nah_idmeme';
const UPDATES='@Updamper_bot';
async function tg(env,method,body){const r=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return r.json();}
const edit=(env,chat_id,message_id,text,reply_markup)=>tg(env,'editMessageText',{chat_id,message_id,text,parse_mode:'Markdown',...(reply_markup?{reply_markup}:{})});
const send=(env,chat_id,text,reply_markup)=>tg(env,'sendMessage',{chat_id,text,parse_mode:'Markdown',...(reply_markup?{reply_markup}:{})});
const ack=(env,id,text='')=>tg(env,'answerCallbackQuery',{callback_query_id:id,text});
const join=()=>({inline_keyboard:[[{text:'🧠 JOIN MEME CHANNEL',url:'https://t.me/nah_idmeme'}],[{text:'🔥 JOIN UPDATES CHANNEL',url:'https://t.me/Updamper_bot'}],[{text:'✅ CHECK MEMBERSHIP',callback_data:'check_membership'}]]});
async function member(env,ch,id){const r=await tg(env,'getChatMember',{chat_id:ch,user_id:id});return !!(r.ok&&['creator','administrator','member'].includes(r.result?.status));}
async function allowed(env,id){if(env.OWNER_TELEGRAM_ID&&String(env.OWNER_TELEGRAM_ID)===String(id))return true;return member(env,MEME,id)&&member(env,UPDATES,id);}
const mainMenu=()=>({inline_keyboard:(MENU_CONFIG.main||[]).reduce((rows,[text,callback_data],i)=>{if(i%2===0)rows.push([]);rows.at(-1).push({text,callback_data});return rows;},[])});
const gamesMenu=()=>({inline_keyboard:[[{text:'🧠 BRAIN',callback_data:'safe_games_brain'}],[{text:'⚡ REACTION',callback_data:'games_reaction'},{text:'🎭 SOCIAL',callback_data:'games_social'}],[{text:'⬅️ BACK',callback_data:'menu_main'}]]});
const brainMenu=()=>({inline_keyboard:[[{text:'🧠 TRIVIA',callback_data:'safe_brain_trivia'}],[{text:'➗ MATH',callback_data:'safe_brain_math'}],[{text:'🔤 ANAGRAM',callback_data:'safe_brain_anagram'}],[{text:'😀 EMOJI',callback_data:'safe_brain_emoji'}],[{text:'🏳️ FLAGS',callback_data:'safe_brain_flags'}],[{text:'⬅️ BACK',callback_data:'games_main'}]]});
const back=()=>({inline_keyboard:[[{text:'⬅️ BACK',callback_data:'games_main'}]]});
const reactionMenu=()=>({text:'⚡ *REACTION GAMES*\n\nFast, simple and no wager required.',reply_markup:{inline_keyboard:[[{text:'⚡ REACTION TEST',callback_data:'safe_reaction_test'}],[{text:'⬅️ BACK',callback_data:'games_main'}]]}});
const socialView=()=>socialMenu();
async function safeCallback(env,q){
  const d=String(q.data||'');
  const supported=d==='games_main'||d==='games_social'||d==='games_reaction'||d==='safe_games_brain'||d.startsWith('safe_')||d.startsWith('social_');
  if(!supported)return false;
  await ack(env,q.id);
  const chat=q.message?.chat?.id,mid=q.message?.message_id;
  if(!(await allowed(env,q.from.id)))return edit(env,chat,mid,'🔒 *ACCESS LOCKED*\n\nJoin both channels, then check membership.',join());
  if(d==='games_main')return edit(env,chat,mid,'🎮 *GAMES*\n\nChoose a safe game category.',gamesMenu());
  if(d==='safe_games_brain')return edit(env,chat,mid,'🧠 *BRAIN GAMES*\n\nChoose a challenge.',brainMenu());
  if(d==='games_social'||d==='social_main'){const view=socialView();return edit(env,chat,mid,view.text,view.reply_markup);}
  if(d==='games_reaction')return edit(env,chat,mid,...Object.values(reactionMenu()));
  if(d.startsWith('safe_brain_')){const category=d.slice(11);return edit(env,chat,mid,`🧠 *${category.toUpperCase()}*\n\nThe question engine is connected.\n\nQuestion delivery is the next wiring step.`,brainMenu());}
  if(d==='social_truth'||d==='social_dare'||d==='social_random'){const r=socialPrompt(d.slice(7),[]);return edit(env,chat,mid,`🎭 *${r.type}*\n\n${r.prompt}`,{inline_keyboard:[[{text:'🔄 AGAIN',callback_data:d}],[{text:'⬅️ SOCIAL',callback_data:'games_social'}]]});}
  if(d==='social_hotseat')return edit(env,chat,mid,'🔥 *HOT SEAT*\n\nThis group mode needs player tracking before it can start.',{inline_keyboard:[[{text:'⬅️ SOCIAL',callback_data:'games_social'}]]});
  if(d==='social_impostor')return edit(env,chat,mid,'🕵️ *IMPOSTOR*\n\nThis group mode needs player tracking before it can start.',{inline_keyboard:[[{text:'⬅️ SOCIAL',callback_data:'games_social'}]]});
  if(d==='safe_reaction_test'){const round=startReactionTest(Date.now());const id=`${Date.now()}_${round.goAt}`;return edit(env,chat,mid,'⚡ *REACTION TEST*\n\nWait for GO, then tap it as quickly as you can.',{inline_keyboard:[[{text:'🟢 GO!',callback_data:`safe_reaction_go:${id}:${round.goAt}`}],[{text:'❌ CANCEL',callback_data:'games_reaction'}]]});}
  if(d.startsWith('safe_reaction_go:')){const [,id,goAt]=d.split(':');const result=resolveReactionTest({goAt:Number(goAt)},Date.now(),false);if(!result.ok)return send(env,chat,'⌛ Reaction round expired.',back());return edit(env,chat,mid,`⚡ *REACTION TEST*\n\n⏱️ ${result.ms} ms\n\nNo wager — just speed.`,back());}
  return false;
}
export default {async fetch(request,env,ctx){if(request.method==='POST'&&new URL(request.url).pathname==='/telegram/webhook'){const clone=request.clone();try{const update=await clone.json();if(update.message?.text?.trim().split(/\s+/)[0].toLowerCase()==='/menu'){await send(env,update.message.chat.id,'🔥 *THE DAMPER_BOT V2*',mainMenu());return new Response('OK');}if(update.callback_query){const handled=await safeCallback(env,update.callback_query);if(handled!==false)return new Response('OK');}}catch(e){console.error('safe wrapper callback error',e);}}return base.fetch(request,env,ctx);}};
