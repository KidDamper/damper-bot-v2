import { listRpgShop, buyRpgItem, equipRpgItem } from '../rpg/shop-service.js';
const kb=inline_keyboard=>({inline_keyboard});
export async function rpgShopView(env,type){const items=listRpgShop(type);const labels={SKILL:'✨ SKILLS',WEAPON:'⚔️ WEAPONS',ARMOR:'🛡️ ARMOR',ACCESSORY:'💠 ACCESSORIES'};const rows=items.map(x=>[{text:`${x.name} — ${x.price.toLocaleString()}`,callback_data:`rpg_buy:${type}:${x.id}`}]);rows.push([{text:'⬅️ RPG SHOP',callback_data:'rpg_shop_home'}]);return{text:`🛒 *${labels[type]||'RPG SHOP'}*\n\nChoose an item to purchase.`,reply_markup:kb(rows)};}
export async function purchaseAndEquip(env,userId,type,itemId,equip=false){const result=await buyRpgItem(env,userId,type,itemId);if(!result.ok)return result;if(equip)await equipRpgItem(env,userId,type,itemId);return result;}
export async function equip(env,userId,type,itemId){return equipRpgItem(env,userId,type,itemId);}
export function purchaseView(result){if(!result?.ok)return `❌ ${result?.error||'Purchase failed.'}`;return `🛒 *PURCHASED*\n\n${result.item.name}\n💰 ${Number(result.item.price).toLocaleString()} Damper Coins\n\nUse your RPG inventory to equip it.`;}
