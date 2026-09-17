const POOLS={
  EASY:{COMMON:60,UNCOMMON:30,RARE:10},
  MEDIUM:{COMMON:40,UNCOMMON:40,RARE:18,EXCLUSIVE:2},
  HARD:{UNCOMMON:35,RARE:45,EPIC:17,LEGENDARY:3},
  ELITE:{RARE:35,EPIC:45,LEGENDARY:18,MYTHIC:2},
  BOSS:{RARE:25,EPIC:45,LEGENDARY:25,MYTHIC:5}
};

const ITEMS={
  EASY:[['rpg_iron_fang','Iron Fang','COMMON'],['rpg_scrap_guard','Scrap Guard','COMMON'],['rpg_beast_claw','Beast Claw','UNCOMMON'],['rpg_street_core','Street Core','RARE']],
  MEDIUM:[['rpg_steel_fang','Steel Fang','COMMON'],['rpg_warden_plate','Warden Plate','UNCOMMON'],['rpg_shadow_edge','Shadow Edge','RARE'],['rpg_warden_core','Warden Core','EXCLUSIVE']],
  HARD:[['rpg_ronin_mask','Ronin Mask','UNCOMMON'],['rpg_night_edge','Night Edge','RARE'],['rpg_void_shard','Void Shard','EPIC'],['rpg_ronin_seal','Ronin Seal','LEGENDARY']],
  ELITE:[['rpg_void_fragment','Void Fragment','RARE'],['rpg_phantom_edge','Phantom Edge','EPIC'],['rpg_void_plate','Void Plate','LEGENDARY'],['rpg_null_relic','Null Relic','MYTHIC']],
  BOSS:[['rpg_boss_core','Boss Core','RARE'],['rpg_cursed_relic','Cursed Relic','EPIC'],['rpg_emperor_shard','Emperor Shard','LEGENDARY'],['rpg_final_relic','Final Relic','MYTHIC']]
};

function pickTier(tier){
  const pool=POOLS[tier]||POOLS.EASY,total=Object.values(pool).reduce((a,b)=>a+b,0),roll=Math.random()*total;
  let n=0;for(const [rarity,weight] of Object.entries(pool)){n+=weight;if(roll<n)return rarity;}return Object.keys(pool)[0];
}

export function rollLoot(enemy){
  const tier=enemy?.tier||'EASY',rarity=pickTier(tier),candidates=(ITEMS[tier]||ITEMS.EASY).filter(x=>x[2]===rarity);
  if(!candidates.length)return null;
  const [id,name]=candidates[Math.floor(Math.random()*candidates.length)];
  return {id,name,rarity,tier};
}

export async function grantLoot(env,userId,loot){
  if(!loot)return {duplicate:false,loot:null};
  const existing=await env.DB.prepare('SELECT quantity FROM rpg_inventory WHERE user_id=? AND item_id=?').bind(userId,loot.id).first();
  if(existing){
    return {duplicate:true,loot,quantity:Number(existing.quantity),converted:{coins:250,xp:10}};
  }
  await env.DB.prepare('INSERT INTO rpg_inventory(user_id,item_id,item_type,quantity) VALUES(?,?,?,1)').bind(userId,loot.id,'LOOT').run();
  return {duplicate:false,loot,quantity:1};
}

export function lootText(result){
  if(!result?.loot)return '🎁 No loot this time.';
  if(result.duplicate)return `♻️ Duplicate drop: *${result.loot.name}* (${result.loot.rarity})\nConverted to +${result.converted?.coins||250} Coins and +${result.converted?.xp||10} RPG XP.`;
  return `🎁 *LOOT DROP*\n${result.loot.name}\nRarity: *${result.loot.rarity}*`;
}
