import { CARDS, PETS, NUMBERED_DRAW_PRICE } from './catalog.js';
import { buyPet, drawCard, drawNumbered, vaultCards, vaultPets, vaultNumbered } from './service.js';
import { shopHome, cardTiers, petsMenu, numberedMenu, rpgShopMenu } from './ui.js';

const kb=inline_keyboard=>({inline_keyboard});
const back=()=>kb([[{text:'⬅️ SHOP',callback_data:'menu_shop'}]]);
const money=n=>Number(n||0).toLocaleString();

export function cardMenu(tier){const list=CARDS.filter(x=>x.tier===String(tier).toUpperCase());return kb([...list.map(x=>[{text:`🃏 ${x.name} — ${money(x.price)}`,callback_data:`shop_card_draw:${x.id}`}]),[{text:'⬅️ TIERS',callback_data:'shop_cards'}]]);}
export function petPurchaseMenu(){return petsMenu();}

export async function handleShopCallback(env,userId,data){
  if(data==='menu_shop'||data==='shop_home')return{ok:true,text:'🛒 *SHOP*\n\nChoose a collection.',keyboard:shopHome()};
  if(data==='shop_cards')return{ok:true,text:'🃏 *CARD DRAWS*\n\nChoose a tier.',keyboard:cardTiers()};
  if(data.startsWith('shop_card_tier:')){const tier=data.split(':')[1];return{ok:true,text:`🃏 *${tier} CARDS*\n\nChoose your draw.`,keyboard:cardMenu(tier)};}
  if(data.startsWith('shop_card_draw:')){const id=data.split(':')[1],card=CARDS.find(x=>x.id===id);if(!card)return{ok:false,text:'⚠️ Card not found.',keyboard:back()};const r=await drawCard(env,userId,card.tier);if(!r.ok)return{ok:false,text:'❌ Not enough Damper Coins.',keyboard:back()};return{ok:true,text:`🃏 *CARD DRAW*\n\n✨ ${r.card.name}\nTier: *${r.card.tier}*\n\n${r.duplicate?'♻️ Duplicate added to your Vault.':'🎉 New card discovered!'}`,keyboard:back()};}
  if(data==='shop_pets')return{ok:true,text:'🐾 *PETS*\n\nPets provide small luck bonuses and can be equipped from your Vault.',keyboard:petsMenu()};
  if(data.startsWith('shop_pet:')){const id=data.split(':')[1],r=await buyPet(env,userId,id);if(!r.ok)return{ok:false,text:r.error==='ALREADY_OWNED'?'🐾 You already own this pet.':'❌ Not enough Damper Coins.',keyboard:back()};return{ok:true,text:`🐾 *PET ACQUIRED*\n\n${r.pet.name}\nTier: *${r.pet.tier}*\nLuck: +${r.pet.luck}`,keyboard:back()};}
  if(data==='shop_numbered')return{ok:true,text:`🔢 *NUMBERED ITEMS*\n\nEach draw costs *${money(NUMBERED_DRAW_PRICE)}* Coins.\n\nThere are 16 unique items. Discoveries are permanent.`,keyboard:numberedMenu()};
  if(data==='shop_numbered_draw'){const r=await drawNumbered(env,userId);if(!r.ok)return{ok:false,text:'❌ Not enough Damper Coins.',keyboard:back()};if(r.hit)return{ok:true,text:`🔢 *NUMBERED ITEM DISCOVERED*\n\n#${String(r.item.id).padStart(2,'0')} — *${r.item.name}*\n\n🎉 Added permanently to your Vault.`,keyboard:back()};if(r.complete)return{ok:true,text:`🔢 *COLLECTION COMPLETE*\n\nAll 16 items are already discovered.\n💰 +${money(r.reward.coins)} Coins\n✨ +${money(r.reward.xp)} XP`,keyboard:back()};return{ok:true,text:`🔢 *DRAW MISSED*\n\nNo numbered item this time.\n💰 +${money(r.reward.coins)} Coins\n✨ +${money(r.reward.xp)} XP`,keyboard:back()};}
  if(data==='shop_rpg')return{ok:true,text:'⚔️ *RPG SHOP*\n\nChoose a category.',keyboard:rpgShopMenu()};
  return null;
}

export async function vaultText(env,userId,section='home'){
  if(section==='cards'){const rows=await vaultCards(env,userId);return `🃏 *CARDS*\n\n${rows.map(x=>`${x.quantity?'✓':'□'} ${x.name} — ${x.tier}${x.quantity>1?` ×${x.quantity}`:''}`).join('\n')||'No cards yet.'}`;}
  if(section==='pets'){const rows=await vaultPets(env,userId);return `🐾 *PETS*\n\n${rows.map(x=>`✓ ${x.name} — ${x.tier} | Luck +${x.luck}`).join('\n')||'No pets yet.'}`;}
  if(section==='numbered'){const rows=await vaultNumbered(env,userId);return `🔢 *NUMBERED ITEMS*\n\n${rows.map(x=>`#${String(x.id).padStart(2,'0')} ${x.discovered?'✓ '+x.name:'?'}`).join('\n')}`;}
  return '🗃️ *VAULT*\n\nYour cards, pets, numbered items, achievements, titles and RPG inventory live here.';
}
