import { startRpgBattle, applyRpgAction, rpgKeyboardFor, rpgSkillKeyboard, rpgMessage } from './telegram.js';
import { getRpgProfile, levelUpRpg } from './progression.js';

const kb=inline_keyboard=>({inline_keyboard});
export const rpgHome=()=>kb([[{text:'⚔️ BATTLE',callback_data:'rpg_start'}],[{text:'⬆️ LEVEL UP',callback_data:'rpg_levelup'},{text:'🎒 INVENTORY',callback_data:'rpg_inv'}],[{text:'📊 RPG PROFILE',callback_data:'rpg_prof'}],[{text:'⬅️ BACK',callback_data:'menu_main'}]]);
export const battleActions=sid=>rpgKeyboardFor({status:'ACTIVE'},sid);
export const skillsActions=sid=>rpgSkillKeyboard(sid);
export function formatProfile(p){if(!p)return '⚠️ RPG profile unavailable.';const s=p.stats;return `⚔️ *RPG PROFILE*\n\n🆔 ${p.damper_id}\n⭐ RPG Level: ${p.rpg_level}\n✨ RPG XP: ${p.rpg_xp}\n\n❤️ HP: ${s.hp}\n⚔️ ATK: ${s.atk}\n🛡️ DEF: ${s.def}\n⚡ Energy: ${s.energy}\n💨 Speed: ${s.speed}`;}
export async function rpgStart(env,userId,chatId){return startRpgBattle(env,userId,chatId,1);}
export async function rpgAction(env,id,userId,action,skill){return applyRpgAction(env,id,userId,action,skill);}
export async function rpgProfile(env,userId){return getRpgProfile(env,userId);}
export async function rpgLevelUp(env,userId){return levelUpRpg(env,userId);}
export function rpgBattleView(result){const reward=result.reward?`\n\n💰 +${result.reward.coins} Coins\n✨ +${result.reward.xp} RPG XP`:'';return rpgMessage(result.battle)+reward;}
