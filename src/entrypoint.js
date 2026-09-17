import v3 from './index-v3.js';
import { startRpgBattle, applyRpgAction, rpgMessage } from './rpg/telegram.js';
import { getRpgProfile, levelUpRpg } from './rpg/progression.js';
import { getRpgInventory } from './rpg/shop-service.js';
import { equippedStats } from './rpg/equipment-stats.js';
import { shopHome, cardTiers, petsMenu, numberedMenu, rpgShopMenu } from './shop/ui.js';
import { drawCard, buyPet, drawNumbered } from './shop/service.js';
import { rpgShopView, purchaseAndEquip, purchaseView } from './shop/rpg-ui.js';
import { getVault, vaultSummary } from './vault/vault.js';
import { leaderboard, formatLeaderboard } from './leaderboards/service.js';

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
function shopResultText(r){if(!r?.ok)return `❌ ${r?.error||'Action failed.'}`;if(r.card)return `🃏 *CARD DRAW*\n\n${r.card.name}\nTier: ${r.card.tier}\n💰 Cost: ${r.card.price.toLocaleString()}`;if(r.pet)return `🐾 *PET ACQUIRED*\n\n${r.pet.name}\nTier: ${r.pet.tier}\n🍀 Luck: +${r.pet.luck||0}`;if(r.item)return `🔢 *NUMBERED ITEM DISCOVERED*\n\n#${String(r.item.id).padStart(2,'0')} — ${r.item.name}\n\n${r.item.description||''}`;if(r.miss)return `🔢 *NUMBERED DRAW*\n\nNothing new this time.\n💰 +${r.reward.coins} Coins\n✨ +${r.reward.xp} XP`;return '✅ Done.';}
function shopHomeText(){return '🛒 *SHOP*\n\nChoose what you want to collect or buy.';}
function vaultText(v){const cardLines=v.cards.length?v.cards.slice(0,20).map(x=>`• ${x.name} — ×${x.quantity}`).join('\n'):'None';const petLines=v.pets.length?v.pets.map(x=>`• ${x.name} — ${x.tier}`).join('\n'):'None';const numLines=v.numbered.length?v.numbered.map(x=>`• #${String(x.id).padStart(2,'0')} ${x.name}`).join('\n'):'None';return `🗃️ *VAULT*\n\n🃏 *Cards*\n${cardLines}\n\n🐾 *Pets*\n${petLines}\n\n🔢 *Numbered*\n${numLines}\n\n⚔️ RPG items: ${v.rpg.length}`;}
const vaultMenu=()=>kb([[{text:'🃏 CARDS',callback_data:'vault_cards'},{text:'🐾 PETS',callback_data:'vault_pets'}],[{text:'🔢 NUMBERED',callback_data:'vault_numbered'},{text:'⚔️ RPG INVENTORY',callback_data:'vault_rpg'}],[{text:'📦 SUMMARY',callback_data:'vault_summary'}],[{text:'⬅️ BACK',callback_data:'menu_main'}]]);
const leaderboardMenu=()=>kb([[{text:'💰 RICHEST',callback_data:'leaderboard:coins'},{text:'✨ XP',callback_data:'leaderboard:xp'}],[{text:'🏆 WINS',callback_data:'leaderboard:wins'},{text:'🎮 GAMES',callback_data:'leaderboard:games'}],[{text:'⚔️ RPG',callback_data:'leaderboard:rpg'},{text:'🃏 COLLECTOR',callback_data:'leaderboard:collector'}],[{text:'🏅 ACHIEVEMENTS',callback_data:'leaderboard:achievements'},{text:'💎 HIGH STAKES',callback_data:'leaderboard:wager'}],[{text:'⬅️ BACK',callback_data:'menu_main'}]]);
const shopBack=()=>kb([[{text:'⬅️ SHOP',callback_data:'shop_main'}]]);
async function handleShop(env,q,u){const chat=q.message.chat.id,mid=q.message.message_id,d=q.data;
  if(d==='shop_main')return edit(env,chat,mid,shopHomeText(),shopHome());
  if(d==='shop_cards')return edit(env,chat,mid,'🃏 *CARDS*\n\nChoose a tier.',cardTiers());
  if(d.startsWith('shop_card_tier:')){const tier=d.split(':')[1];return edit(env,chat,mid,`🃏 *${tier} CARDS*\n\nDraw one random card for the tier price.`,kb([[{text:`🎴 DRAW ${tier}`,callback_data:`shop_card_draw:${tier}`}],[{text:'⬅️ CARDS',callback_data:'shop_cards'}]]));}
  if(d.startsWith('shop_card_draw:')){const r=await drawCard(env,u.id,d.split(':')[1]);return edit(env,chat,mid,shopResultText(r),shopBack());}
  if(d==='shop_pets')return edit(env,chat,mid,'🐾 *PETS*\n\nChoose a pet.',petsMenu());
  if(d.startsWith('shop_pet:')){const r=await buyPet(env,u.id,d.split(':')[1]);return edit(env,chat,mid,shopResultText(r),shopBack());}
  if(d==='shop_numbered')return edit(env,chat,mid,'🔢 *NUMBERED ITEMS*\n\n16 unique items. Each draw costs 250,000 Coins.',numberedMenu());
  if(d==='shop_numbered_draw'){const r=await drawNumbered(env,u.id);return edit(env,chat,mid,shopResultText(r),shopBack());}
  if(d==='shop_rpg')return edit(env,chat,mid,'⚔️ *RPG SHOP*\n\nChoose a category.',rpgShopMenu());
  if(d.startsWith('rpg_shop:')){const type=d.split(':')[1];const page=await rpgShopView(env,type);return edit(env,chat,mid,page.text,page.reply_markup);}
  if(d.startsWith('rpg_buy:')){const [,type,itemId]=d.split(':');const r=await purchaseAndEquip(env,u.id,type,itemId,false);return edit(env,chat,mid,purchaseView(r),shopBack());}
  return false;
}
async function handleVault(env,q,u){const chat=q.message.chat.id,mid=q.message.message_id,d=q.data;
  if(d==='vault_main')return edit(env,chat,mid,'🗃️ *VAULT*\n\nYour collection.',vaultMenu());
  if(d==='vault_summary'){const s=await vaultSummary(env,u.id);return edit(env,chat,mid,`🗃️ *VAULT SUMMARY*\n\n🃏 Cards: ${s.cards}\n🐾 Pets: ${s.pets}\n🔢 Numbered: ${s.numbered}/${s.totalNumbered}\n⚔️ RPG items: ${s.rpg}`,vaultMenu());}
  if(d==='vault_cards'||d==='vault_pets'||d==='vault_numbered'||d==='vault_rpg'){const v=await getVault(env,u.id);if(d==='vault_cards')return edit(env,chat,mid,v.cards.length?`🃏 *CARDS*\n\n${v.cards.map(x=>`• ${x.name} — ×${x.quantity}`).join('\n')}`:'🃏 *CARDS*\n\nNone yet.',vaultMenu());if(d==='vault_pets')return edit(env,chat,mid,v.pets.length?`🐾 *PETS*\n\n${v.pets.map(x=>`• ${x.name} — ${x.tier} — Luck +${x.luck||0}`).join('\n')}`:'🐾 *PETS*\n\nNone yet.',vaultMenu());if(d==='vault_numbered')return edit(env,chat,mid,v.numbered.length?`🔢 *NUMBERED ITEMS*\n\n${v.numbered.map(x=>`• #${String(x.id).padStart(2,'0')} ${x.name}`).join('\n')}`:'🔢 *NUMBERED ITEMS*\n\nNone discovered yet.',vaultMenu());return edit(env,chat,mid,v.rpg.length?`⚔️ *RPG INVENTORY*\n\n${v.rpg.map(x=>`• ${x.item_id} ×${x.quantity}`).join('\n')}`:'⚔️ *RPG INVENTORY*\n\nEmpty.',vaultMenu());}
  return false;
}
async function handleLeaderboard(env,q){const chat=q.message.chat.id,mid=q.message.message_id,d=q.data;if(d==='leaderboard_main')return edit(env,chat,mid,'📊 *LEADERBOARD*\n\nChoose a ranking.',leaderboardMenu());if(d.startsWith('leaderboard:')){const metric=d.split(':')[1];const titles={coins:'RICHEST',xp:'XP',wins:'WINS',games:'GAMES',rpg:'RPG',collector:'COLLECTOR',achievements:'ACHIEVEMENTS',wager:'HIGH STAKES'};const rows=await leaderboard(env,metric,10);return edit(env,chat,mid,formatLeaderboard(rows,titles[metric]||'LEADERBOARD'),leaderboardMenu());}return false;}
async function handle(env,update){const msg=update.message,q=update.callback_query;
  if(msg?.text&&msg.text.trim().split(/\s+/)[0].toLowerCase()==='/rpg'){if(!(await allowed(env,msg.from.id)))return send(env,msg.chat.id,'🔒 Access locked. Use /start to verify membership.');return send(env,msg.chat.id,'⚔️ *RPG*\n\nChoose your path.',home());}
  if(!q)return false;const d=q.data||'';if(!d.startsWith('rpg_')&&!d.startsWith('shop_')&&!d.startsWith('vault_')&&!d.startsWith('leaderboard:')&&d!=='leaderboard_main'&&!d.startsWith('rpg_buy:'))return false;
  await ack(env,q.id);if(!(await allowed(env,q.from.id)))return edit(env,q.message.chat.id,q.message.message_id,'🔒 *ACCESS LOCKED*');const u=await user(env,q.from.id);if(!u)return send(env,q.message.chat.id,'⚠️ Account not ready. Use /start first.');
  if(d.startsWith('shop_')||d.startsWith('rpg_shop:')||d.startsWith('rpg_buy:'))return handleShop(env,q,u);
  if(d.startsWith('vault_'))return handleVault(env,q,u);
  if(d.startsWith('leaderboard:')||d==='leaderboard_main')return handleLeaderboard(env,q);
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
export default {async fetch(request,env,ctx){if(request.method==='POST'&&new URL(request.url).pathname==='/telegram/webhook'){const clone=request.clone();try{if(await handle(env,await clone.json()))return new Response('OK');}catch(e){console.error('V2 entrypoint:',e);}}return v3.fetch(request,env,ctx);}};
