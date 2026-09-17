// Central UI/theme configuration. Keep presentation changes here instead of scattering
// Telegram copy, banner IDs, and layout constants across the bot entrypoint.
export const THEME={
  brand:'THE DAMPER_BOT',
  banner:{
    main:'AgACAgQAAxkBAAMIaqrLcsPcHMx7oPIUstU4FEnr7UYAAuEYaxsFs1lRZUeHg_eeON4BAAMCAAN5AAM9BA',
    enabled:true
  },
  labels:{
    games:'🎮 GAMES',
    economy:'💰 ECONOMY',
    rpg:'⚔️ RPG',
    shop:'🛒 SHOP',
    vault:'🗃️ VAULT',
    leaderboard:'📊 LEADERBOARD',
    profile:'👤 PROFILE',
    help:'❓ HELP'
  },
  footer:'Powered by KIDDAMPER'
};

export function bannerId(key='main'){
  if(!THEME.banner.enabled)return null;
  return THEME.banner[key]||null;
}

export function label(key,fallback=key){return THEME.labels[key]||fallback;}
