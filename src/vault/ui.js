const kb=inline_keyboard=>({inline_keyboard});

export const vaultHome=()=>kb([
  [{text:'🃏 CARDS',callback_data:'vault_cards'},{text:'🐾 PETS',callback_data:'vault_pets'}],
  [{text:'🔢 NUMBERED',callback_data:'vault_numbered'}],
  [{text:'⚔️ RPG INVENTORY',callback_data:'vault_rpg'}],
  [{text:'🏆 ACHIEVEMENTS',callback_data:'vault_achievements'}],
  [{text:'🏅 TITLES',callback_data:'vault_titles'}],
  [{text:'⬅️ BACK',callback_data:'menu_main'}]
]);

export function numberedBoard(discovered=[]){
  const rows=[];
  for(let i=1;i<=16;i+=4){
    rows.push(Array.from({length:4},(_,j)=>{const n=i+j;return {text:discovered.includes(n)?`#${String(n).padStart(2,'0')} ✓`:`#${String(n).padStart(2,'0')} ?`,callback_data:`vault_number:${n}`};}));
  }
  rows.push([{text:'⬅️ VAULT',callback_data:'vault_main'}]);
  return kb(rows);
}

export function tierFilter(){return kb([[{text:'ALL',callback_data:'vault_cards:ALL'},{text:'COMMON',callback_data:'vault_cards:COMMON'}],[{text:'RARE',callback_data:'vault_cards:RARE'},{text:'MYTHIC',callback_data:'vault_cards:MYTHIC'}],[{text:'⬅️ VAULT',callback_data:'vault_main'}]]);}
