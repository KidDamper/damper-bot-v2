import { CARDS, PETS, NUMBERED_DRAW_PRICE, NUMBERED_COUNT, numberedMissReward } from './catalog.js';
import { isOwner } from '../owner/console.js';
import { debit, credit } from '../core/wallet.js';

const now=()=>Math.floor(Date.now()/1000);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const creator=(env,userId)=>!!(env.OWNER_TELEGRAM_ID&&String(env.OWNER_TELEGRAM_ID)===String(userId));

async function charge(env,userId,amount){try{await debit(env,userId,amount);return true;}catch(e){if(e?.message==='INSUFFICIENT_BALANCE')return false;throw e;}}
async function refund(env,userId,amount){if(amount>0)await credit(env,userId,amount);}
async function transaction(env,userId,amount,type,source){await env.DB.prepare('INSERT INTO transactions(user_id,amount,type,source,reference,created_at) VALUES(?,?,?,?,?,?)').bind(userId,amount,type,source,crypto.randomUUID(),now()).run();}

export async function buyPet(env,userId,petId){
  const pet=PETS.find(x=>x.id===petId); if(!pet)return {ok:false,error:'PET_NOT_FOUND'};
  const owned=await env.DB.prepare('SELECT 1 FROM user_pets WHERE user_id=? AND pet_id=?').bind(userId,petId).first();
  if(owned)return {ok:false,error:'ALREADY_OWNED',pet};
  const free=creator(env,userId);
  if(!free&&!await charge(env,userId,pet.price))return {ok:false,error:'INSUFFICIENT'};
  try{await env.DB.prepare('INSERT INTO user_pets(user_id,pet_id) VALUES(?,?)').bind(userId,petId).run();if(!free)await transaction(env,userId,-pet.price,'SHOP_PURCHASE','pet_shop');}
  catch(e){if(!free)await refund(env,userId,pet.price);throw e;}
  return {ok:true,pet,creator:free};
}

export async function drawCard(env,userId,tier){
  const pool=CARDS.filter(x=>x.tier===String(tier).toUpperCase()); if(!pool.length)return {ok:false,error:'TIER_NOT_FOUND'};
  const card=pick(pool),free=creator(env,userId);
  if(!free&&!await charge(env,userId,card.price))return {ok:false,error:'INSUFFICIENT'};
  let duplicate=false;
  try{
    const owned=await env.DB.prepare('SELECT quantity FROM user_cards WHERE user_id=? AND card_id=?').bind(userId,card.id).first();
    duplicate=!!owned;
    if(owned)await env.DB.prepare('UPDATE user_cards SET quantity=quantity+1 WHERE user_id=? AND card_id=?').bind(userId,card.id).run();
    else await env.DB.prepare('INSERT INTO user_cards(user_id,card_id,quantity) VALUES(?,?,1)').bind(userId,card.id).run();
    if(!free)await transaction(env,userId,-card.price,'CARD_DRAW',duplicate?'card_duplicate':'card_draw');
  }catch(e){if(!free)await refund(env,userId,card.price);throw e;}
  return {ok:true,card,duplicate,creator:free};
}

export async function drawNumbered(env,userId){
  const owned=await env.DB.prepare('SELECT item_id FROM user_numbered_items WHERE user_id=?').bind(userId).all();
  const ids=new Set((owned.results||[]).map(x=>Number(x.item_id)));
  const reward=numberedMissReward(ids.size>=NUMBERED_COUNT),free=creator(env,userId);
  if(!free&&!await charge(env,userId,NUMBERED_DRAW_PRICE))return {ok:false,error:'INSUFFICIENT'};
  const all=await env.DB.prepare('SELECT * FROM numbered_items ORDER BY id').all();
  const missing=(all.results||[]).filter(x=>!ids.has(Number(x.id)));
  if(!missing.length){if(!free)await refund(env,userId,NUMBERED_DRAW_PRICE);await refund(env,userId,reward.coins);if(!free)await transaction(env,userId,reward.coins,'NUMBERED_COMPLETE','numbered_draw');return {ok:true,complete:true,reward,creator:free};}
  if(Math.random()>=0.0025){if(!free)await refund(env,userId,reward.coins);if(!free)await transaction(env,userId,-NUMBERED_DRAW_PRICE+reward.coins,'NUMBERED_MISS','numbered_draw');await env.DB.prepare('UPDATE xp SET damper_xp=damper_xp+? WHERE user_id=?').bind(reward.xp,userId).run();return {ok:true,miss:true,reward,creator:free};}
  const item=pick(missing);
  try{await env.DB.prepare('INSERT INTO user_numbered_items(user_id,item_id,discovered_at) VALUES(?,?,?)').bind(userId,item.id,now()).run();if(!free)await transaction(env,userId,-NUMBERED_DRAW_PRICE,'NUMBERED_DISCOVERY','numbered_draw');}
  catch(e){if(!free)await refund(env,userId,NUMBERED_DRAW_PRICE);throw e;}
  return {ok:true,hit:true,item,creator:free};
}

export async function vaultCards(env,userId,tier=null){
  const q=tier?'SELECT c.*,COALESCE(uc.quantity,0) quantity FROM cards c LEFT JOIN user_cards uc ON uc.card_id=c.id AND uc.user_id=? WHERE c.tier=? ORDER BY c.id':'SELECT c.*,COALESCE(uc.quantity,0) quantity FROM cards c LEFT JOIN user_cards uc ON uc.card_id=c.id AND uc.user_id=? ORDER BY c.id';
  const r=await env.DB.prepare(q).bind(...(tier?[userId,String(tier).toUpperCase()]:[userId])).all();return r.results||[];
}
export async function vaultPets(env,userId){const r=await env.DB.prepare('SELECT p.*,1 AS owned FROM pets p JOIN user_pets up ON up.pet_id=p.id WHERE up.user_id=? ORDER BY p.id').bind(userId).all();return r.results||[];}
export async function vaultNumbered(env,userId){const r=await env.DB.prepare('SELECT n.*,CASE WHEN u.item_id IS NULL THEN 0 ELSE 1 END discovered FROM numbered_items n LEFT JOIN user_numbered_items u ON u.item_id=n.id AND u.user_id=? ORDER BY n.id').bind(userId).all();return r.results||[];
}