export const MENU_CONFIG={
  main:[
    ['🎮 GAMES','games_main'],
    ['💰 ECONOMY','economy_main'],
    ['⚔️ RPG','rpg_main'],
    ['🛒 SHOP','shop_main'],
    ['🗃️ VAULT','vault_main'],
    ['📊 LEADERBOARD','leaderboard_main'],
    ['👤 PROFILE','profile_main'],
    ['❓ HELP','help_main']
  ],
  games:[
    ['🧠 BRAIN','safe_games_brain'],
    ['⚡ REACTION','games_reaction'],
    ['🎭 SOCIAL','games_social']
  ],
  economy:[
    ['💰 BALANCE','economy_balance'],
    ['🎁 DAILY','economy_daily'],
    ['💸 GIVE','economy_give'],
    ['🏆 LEADERBOARD','leaderboard_main']
  ],
  rpg:[
    ['⚔️ BATTLE','rpg_start'],
    ['⬆️ LEVEL UP','rpg_levelup'],
    ['🎒 INVENTORY','rpg_inv'],
    ['📊 RPG PROFILE','rpg_prof']
  ],
  shop:[
    ['🃏 CARDS','shop_cards'],
    ['🐾 PETS','shop_pets'],
    ['🔢 NUMBERED ITEMS','shop_numbered'],
    ['⚔️ RPG SHOP','shop_rpg']
  ],
  vault:[
    ['🃏 CARDS','vault_cards'],
    ['🐾 PETS','vault_pets'],
    ['🔢 NUMBERED ITEMS','vault_numbered'],
    ['⚔️ RPG GEAR','vault_rpg']
  ],
  leaderboard:[
    ['💰 RICHEST','leaderboard:coins'],
    ['⭐ XP','leaderboard:xp'],
    ['🏆 WINS','leaderboard:wins'],
    ['🎮 GAMES','leaderboard:games'],
    ['⚔️ RPG','leaderboard:rpg'],
    ['🃏 COLLECTOR','leaderboard:collector'],
    ['🏅 ACHIEVEMENTS','leaderboard:achievements']
  ],
  profile:[
    ['👤 PROFILE','profile_main'],
    ['🗃️ VAULT','vault_main'],
    ['🏆 LEADERBOARD','leaderboard_main']
  ],
  help:[
    ['📖 COMMANDS','help_commands'],
    ['🎮 GAMES','help_games'],
    ['💰 ECONOMY','help_economy'],
    ['⚔️ RPG','help_rpg']
  ]
};

export function menuRows(name,button){
  const items=MENU_CONFIG[name]||[];
  const rows=[];
  for(let i=0;i<items.length;i+=2){
    const row=[button(...items[i])];
    if(items[i+1])row.push(button(...items[i+1]));
    rows.push(row);
  }
  return rows;
}
