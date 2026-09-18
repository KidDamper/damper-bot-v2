const kb=inline_keyboard=>({inline_keyboard});

export const shopHome=()=>kb([
  [{text:'🃏 CARDS',callback_data:'shop_cards'},{text:'🐾 PETS',callback_data:'shop_pets'}],
  [{text:'🔢 NUMBERED ITEMS',callback_data:'shop_numbered'}],
  [{text:'⚔️ RPG SHOP',callback_data:'shop_rpg'}],
  [{text:'⬅️ BACK',callback_data:'menu_main'}]
]);

export const cardTiers=()=>kb([
  [{text:'COMMON — 2,500',callback_data:'shop_card_tier:COMMON'}],
  [{text:'RARE — 10,000',callback_data:'shop_card_tier:RARE'}],
  [{text:'MYTHIC — 40,000',callback_data:'shop_card_tier:MYTHIC'}],
  [{text:'⬅️ SHOP',callback_data:'shop_main'}]
]);

export const petsMenu=()=>kb([
  [{text:'🐱 Lucky Cat — 5,000',callback_data:'shop_pet:p_lucky_cat'}],
  [{text:'🦊 Kitsune — 20,000',callback_data:'shop_pet:p_kitsune'}],
  [{text:'🐉 Ancient Dragon — 125,000',callback_data:'shop_pet:p_ancient_dragon'}],
  [{text:'🐲 Void Dragon — 300,000',callback_data:'shop_pet:p_void_dragon'}],
  [{text:'⬅️ SHOP',callback_data:'shop_main'}]
]);

export const numberedMenu=()=>kb([
  [{text:'🔢 DRAW — 250,000',callback_data:'shop_numbered_draw'}],
  [{text:'⬅️ SHOP',callback_data:'shop_main'}]
]);

export const rpgShopMenu=()=>kb([
  [{text:'✨ SKILLS',callback_data:'rpg_shop:SKILL'},{text:'⚔️ WEAPONS',callback_data:'rpg_shop:WEAPON'}],
  [{text:'🛡️ ARMOR',callback_data:'rpg_shop:ARMOR'},{text:'💠 ACCESSORIES',callback_data:'rpg_shop:ACCESSORY'}],
  [{text:'⬅️ SHOP',callback_data:'shop_main'}]
]);
