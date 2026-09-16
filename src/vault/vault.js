export async function getVault(env,userId){
  const [cards,pets,numbered,rpg] = await Promise.all([
    env.DB.prepare(`SELECT c.id,c.name,c.tier,uc.quantity FROM user_cards uc JOIN cards c ON c.id=uc.card_id WHERE uc.user_id=? ORDER BY CASE c.tier WHEN 'MYTHIC' THEN 1 WHEN 'RARE' THEN 2 ELSE 3 END,c.name`).bind(userId).all(),
    env.DB.prepare(`SELECT p.id,p.name,p.tier,p.luck FROM user_pets up JOIN pets p ON p.id=up.pet_id WHERE up.user_id=? ORDER BY p.price DESC`).bind(userId).all(),
    env.DB.prepare(`SELECT n.id,n.name,n.rarity,n.description FROM numbered_items n JOIN user_numbered_items un ON un.item_id=n.id WHERE un.user_id=? ORDER BY n.id`).bind(userId).all(),
    env.DB.prepare(`SELECT ri.item_id,ri.item_type,ri.quantity,re.weapon_id,re.armor_id,re.accessory_id,re.skill_id FROM rpg_inventory ri LEFT JOIN rpg_equipment re ON re.user_id=ri.user_id WHERE ri.user_id=? ORDER BY ri.item_type,ri.item_id`).bind(userId).all()
  ]);
  return {cards:cards.results||[],pets:pets.results||[],numbered:numbered.results||[],rpg:rpg.results||[]};
}

export async function vaultSummary(env,userId){
  const v=await getVault(env,userId);
  const discovered=v.numbered.length;
  return {cards:v.cards.reduce((n,x)=>n+Number(x.quantity||0),0),pets:v.pets.length,numbered:discovered,totalNumbered:16,rpg:v.rpg.length};
}
