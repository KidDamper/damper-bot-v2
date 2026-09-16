import v3 from './index-v3.js';
import { startRpgBattle, applyRpgAction, rpgMessage } from './rpg/telegram.js';
import { getRpgProfile, levelUpRpg } from './rpg/progression.js';
import { getRpgInventory } from './rpg/shop-service.js';
import { equippedStats } from './rpg/equipment-stats.js';

const MEME='@nah_idmeme',UPDATES='@Updamper_bot';
const tg=(env,method,body)=>fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
const send=(env,chat_id,text,reply_markup)=>tg(env,'sendMessage',{chat_id,text,parse_mode:'Markdown',...(reply_markup?{reply_markup}:{})});
const edit=(env,chat_id,message_id,text,reply_markup)=>tg(env,'editMessageText',{chat_id,message_id,text,parse_mode:'Markdown',...(reply_markup?{reply_markup}:{})});
const ack=(env,id,text='')=>tg(env,'answerCallbackQuery',{callback_query_id:id,text});
const kb=inline_keyboard=>({inline_keyboard});
const home=()=>kb([[{text:'⚔️ BATTLE',callback_data:'rpg_start'}],[{text:'⬆️ LEVEL UP',callback_data:'rpg_levelup'},{text:'🎒 INVENTORY',callback_data:'rpg_inv'}],[{text:'📊 RPG PROFILE',callback_data:'rpg_prof'}],[{text:'⬅️ BACK',callback_data:'menu_main'}]]);
const battle=sid=>kb([[{text:'⚔️ ATTACK',callback_data:`rpg_attack:${sid}`},{text:'🛡️ DEFEND',callback_data:`rpg_defend:${sid}`}],[{text:'🌀 SKILLS',callback_data:`rpg_skills:${sid}`},{text:'🏃 RUN',callback_data:`rpg_run:${sid}`}]]);
const skills=sid=>kb([[{text:'Rasengan',callback_data:`rpg_skill:${sid}:Rasengan`},{text:'Chidori',callback_data:`rpg_skill:${sid}:Chidori`}],[{text:'Shadow Clone',callback_data:`rpg_skill:${sid}:Shadow Clone`},{text:'Black Flash',callback_data:`rpg_skill:${sid}:Black Flash`}],[{text:'Amaterasu',callback_data:`rpg_skill:${sid}:Amaterasu`},{text:'Susanoo',callback_data:`rpg_skill:${sid}:Susanoo`}],[{text:'⬅️ BATTLE',callback_data:`rpg_battle_back:${sid}`}]]);
async function allowed(env,id){if(env.OWNER_TELEGRAM_ID&&String(env.OWNER_TELEGRAM_ID)===String(id))return true;const check=async ch=>{const r=await tg(env,'getChatMember',{chat_id:ch,user_id:id});return !!(r.ok&&['creator','administrator','member'].includes(r.result?.status));};return check(MEME)&&check(UPDATES);}
async function user(env,id){return env.DB.prepare('SELECT u.*,x.rpg_level,x.rpg_xp FROM users u JOIN xp x ON x.user_id=u.id WHERE u.telegram_id=?').bind(String(id)).first();}
function profileText(p,e){const s=p.stats,b=e.bonuses;return `⚔️ *RPG PROFILE*\n\n🆔 ${p.damper_id}\n⭐ Level: ${p.rpg_level}\n✨ RPG XP: ${p.rpg_xp}\n\n❤️ HP: ${s.hp}\n⚔️ ATK: ${s.atk+(b.atk||0)}\n🛡️ DEF: ${s.def+(b.def||0)}\n⚡ Energy: ${s.energy+(b.energy||0)}\n💨 Speed: ${s.speed}`;}
async function handle(env,update){const msg=update.message,q=update.callback_query;
  if(msg?.text&&msg.text.trim().split(/\s+/)[0].toLowerCase()==='/rpg'){
    if(!(await allowed(env,msg.from.id)))return send(env,msg.chat.id,'🔒 Access locked. Use /start to verify membership.');
    return send(env,msg.chat.id,'⚔️ *RPG*\n\nChoose your path.',home());
  }
  if(!q)return false;const d=q.data||'';if(!d.startsWith('rpg_'))return false;
  await ack(env,q.id);if(!(await allowed(env,q.from.id)))return edit(env,q.message.chat.id,q.message.message_id,'🔒 *ACCESS LOCKED*');
  const u=await user(env,q.from.id);if(!u)return send(env,q.message.chat.id,'⚠️ Account not ready. Use /start first.');
  const chat=q.message.chat.id,mid=q.message.message_id;
  if(d==='rpg_start'){const active=await env.DB.prepare("SELECT id FROM game_sessions WHERE player_id=? AND game_type='RPG_BATTLE' AND result IS NULL AND expires_at>? LIMIT 1").bind(u.id,Math.floor(Date.now()/1000)).first();if(active)return send(env,chat,'⏳ You already have an active RPG battle.',home());const r=await startRpgBattle(env,u.id,chat,Number(u.rpg_level)||1);return edit(env,chat,mid,rpgMessage(r.battle),battle(r.id));}
  if(d==='rpg_prof'){const [p,e]=await Promise.all([getRpgProfile(env,u.id),equippedStats(env,u.id)]);return edit(env,chat,mid,profileText(p,e),home());}
  if(d==='rpg_inv'){const inv=await getRpgInventory(env,u.id);const lines=inv.items.length?inv.items.map(x=>`• ${x.item_id} ×${x.quantity}`).join('\n'):'Empty';return edit(env,chat,mid,`🎒 *RPG INVENTORY*\n\n${lines}\n\nWeapon: ${inv.equipment.weapon_id||'—'}\nArmor: ${inv.equipment.armor_id||'—'}\nAccessory: ${inv.equipment.accessory_id||'—'}\nSkill: ${inv.equipment.skill_id||'—'}`,home());}
  if(d==='rpg_levelup'){const r=await levelUpRpg(env,u.id);return edit(env,chat,mid,r.ok?`⬆️ *RPG LEVEL UP!*\n\n⭐ Level ${r.level}\n❤️ HP ${r.stats.hp}\n⚔️ ATK ${r.stats.atk}\n🛡️ DEF ${r.stats.def}\n⚡ Energy ${r.stats.energy}`:`⚠️ ${r.error==='LOW_RPG_XP'?`Need ${r.xpNeeded} more RPG XP.`:r.error==='INSUFFICIENT_COINS'?`Need ${r.coinsNeeded} more Coins.`:'Cannot level up.'}`,home());}
  if(d==='rpg_home')return edit(env,chat,mid,'⚔️ *RPG*\n\nChoose your path.',home());
  if(d.startsWith('rpg_battle_back:'))return edit(env,chat,mid,'⚔️ *RPG BATTLE*\n\nChoose your move.',battle(d.split(':')[1]));
  const m=d.match(/^rpg_(attack|defend|run):(.+)$/);if(m){const r=await applyRpgAction(env,m[2],u.id,m[1]);if(!r.ok)return send(env,chat,`⚠️ ${r.error}`,home());return r.battle.status==='ACTIVE'?edit(env,chat,mid,rpgMessage(r.battle),battle(m[2])):edit(env,chat,mid,rpgMessage(r.battle)+`\n\n💰 +${r.reward?.reward?.coins||0} Coins\n✨ +${r.reward?.reward?.xp||0} RPG XP`,home());}
  const sm=d.match(/^rpg_skills:(.+)$/);if(sm)return edit(env,chat,mid,'🌀 *SKILLS*\n\nChoose a skill.',skills(sm[1]));
  const sk=d.match(/^rpg_skill:([^:]+):(.+)$/);if(sk){const r=await applyRpgAction(env,sk[1],u.id,'skill',sk[2]);if(!r.ok)return send(env,chat,`⚠️ ${r.error}`,home());return r.battle.status==='ACTIVE'?edit(env,chat,mid,rpgMessage(r.battle),battle(sk[1])):edit(env,chat,mid,rpgMessage(r.battle)+`\n\n💰 +${r.reward?.reward?.coins||0} Coins\n✨ +${r.reward?.reward?.xp||0} RPG XP`,home());}
  return true;
}
export default {async fetch(request,env,ctx){if(request.method==='POST'&&new URL(request.url).pathname==='/telegram/webhook'){const clone=request.clone();try{if(await handle(env,await clone.json()))return new Response('OK');}catch(e){console.error('RPG entrypoint:',e);}}return v3.fetch(request,env,ctx);}};
