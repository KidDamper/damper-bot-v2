export const COMMANDS=[
  ['/start','Start the bot and verify access.'],
  ['/menu','Open the main menu.'],
  ['/help','Show command help.'],
  ['/profile','View your Damper profile.'],
  ['/balance','View your Damper Coins balance.'],
  ['/daily','Claim the daily reward.'],
  ['/give','Give virtual Coins to another player.'],
  ['/stats','View your game statistics.'],
  ['/leaderboard','View global leaderboards.'],
  ['/vault','View your collection vault.'],
  ['/shop','Open the shop.'],
  ['/games','Open safe game categories.'],
  ['/rpg','Open the RPG menu.'],
  ['/warn','Issue a moderation warning when authorized.'],
  ['/silence','Silence a member when authorized.'],
  ['/remove','Remove a member when authorized.'],
  ['/lock','Lock a group when authorized.'],
  ['/unlock','Unlock a group when authorized.']
];

export function commandHelp(){return COMMANDS.map(([command,description])=>`${command} — ${description}`).join('\n');}
