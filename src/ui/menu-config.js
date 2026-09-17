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
    ['🎲 CLASSIC','games_classic'],
    ['🧠 BRAIN','games_brain'],
    ['⚡ REACTION','games_reaction'],
    ['🎭 SOCIAL','games_social'],
    ['⚽ PENALTY','games_penalty']
  ],
  economy:[
    ['💰 BALANCE','economy_balance'],
    ['🎁 DAILY','economy_daily'],
    ['💸 GIVE','economy_give'],
    ['🏆 LEADERBOARD','leaderboard_main']
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
