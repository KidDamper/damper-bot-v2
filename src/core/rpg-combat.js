import { RPG, rpgStats, damage, crit, runSuccess } from './rpg.js';

export function createBattle(level=1, enemyIndex=null, bonuses={}){
  const stats=rpgStats(level);
  const pool=RPG.enemies.filter(e=>e.level<=Math.min(50,level+5));
  const enemy=enemyIndex==null?(pool[Math.floor(Math.random()*pool.length)]||RPG.enemies[0]):RPG.enemies[enemyIndex]||RPG.enemies[0];
  const speed=stats.speed+(bonuses.speed||0),def=stats.def+(bonuses.def||0),atk=stats.atk+(bonuses.atk||0),maxEnergy=stats.energy+(bonuses.energy||0);
  const first=speed>enemy.speed?'PLAYER':speed<enemy.speed?'ENEMY':Math.random()<0.5?'PLAYER':'ENEMY';
  return {level,player:{hp:stats.hp,maxHp:stats.hp,atk,def,energy:maxEnergy,maxEnergy,speed,dodgeBonus:Math.min(.30,.05+(bonuses.dodge||0)),defending:false,guardTurns:0,domainTurns:0},enemy:{...enemy,maxHp:enemy.hp,burn:0},turn:first,status:'ACTIVE',log:[`Speed check: ${first==='PLAYER'?'you act first.':'the enemy acts first.'`]};
}

function enemyAttack(battle){
  if(battle.enemy.burn>0){
    const burned=Math.max(0,battle.enemy.hp-10);
    battle={...battle,enemy:{...battle.enemy,hp:burned,burn:battle.enemy.burn-1},log:[...battle.log,'🔥 Burn dealt 10 damage.']};
    if(burned<=0)return {...battle,status:'WON',turn:null};
  }
  if(Math.random()<Math.min(.30,battle.player.dodgeBonus||.05))return {...battle,turn:'PLAYER',player:{...battle.player,defending:false,energy:Math.min(battle.player.maxEnergy,battle.player.energy+10)},log:[...battle.log,'💨 You dodged the enemy attack.']};
  const incoming=damage(battle.enemy.atk,battle.player.def);
  const guarded=battle.player.defending||battle.player.guardTurns>0;
  const amount=guarded?Math.floor(incoming/2):incoming;
  const hp=Math.max(0,battle.player.hp-amount);
  const guardTurns=Math.max(0,(battle.player.guardTurns||0)-(battle.player.defending?0:1));
  const player={...battle.player,hp,defending:false,guardTurns,energy:Math.min(battle.player.maxEnergy,battle.player.energy+10)};
  return {...battle,player,turn:hp<=0?null:'PLAYER',status:hp<=0?'LOST':'ACTIVE',log:[...battle.log,`Enemy dealt ${amount} damage.`]};
}

function playerHit(battle,amount,label){
  const miss=battle.player.domainTurns>0?false:false;
  if(miss)return enemyAttack({...battle,log:[...battle.log,`${label} missed.`]});
  const enemy={...battle.enemy,hp:Math.max(0,battle.enemy.hp-amount)};
  const domainTurns=Math.max(0,(battle.player.domainTurns||0)-1);
  const next={...battle,enemy,player:{...battle.player,domainTurns},log:[...battle.log,`${label} dealt ${amount} damage.`]};
  if(enemy.hp<=0)return {...next,status:'WON',turn:null};
  return enemyAttack(next);
}

export function playerAttack(battle){
  if(!battle||battle.status!=='ACTIVE'||battle.turn!=='PLAYER')return {ok:false,error:'NOT_PLAYER_TURN',battle};
  let amount=damage(battle.player.atk,battle.enemy.def);const isCrit=crit();if(isCrit)amount=Math.floor(amount*1.5);
  return playerHit(battle,amount,`Player ${isCrit?'critical ':''}attack`);
}

export function playerDefend(battle){
  if(!battle||battle.status!=='ACTIVE'||battle.turn!=='PLAYER')return {ok:false,error:'NOT_PLAYER_TURN',battle};
  return enemyAttack({...battle,player:{...battle.player,defending:true},log:[...battle.log,'🛡️ You are defending.']});
}

export function playerRun(battle){
  if(!battle||battle.status!=='ACTIVE'||battle.turn!=='PLAYER')return {ok:false,error:'NOT_PLAYER_TURN',battle};
  if(battle.enemy.tier==='BOSS')return enemyAttack({...battle,log:[...battle.log,'🚫 Boss cannot be escaped.']});
  if(runSuccess())return {...battle,status:'ESCAPED',turn:null,log:[...battle.log,'🏃 You escaped successfully.']};
  return enemyAttack({...battle,log:[...battle.log,'❌ Escape failed.']});
}

export function useSkill(battle,skill){
  if(!battle||battle.status!=='ACTIVE'||battle.turn!=='PLAYER')return {ok:false,error:'NOT_PLAYER_TURN',battle};
  const costs={Rasengan:15,Chidori:20,'Shadow Clone':25,Amaterasu:30,Susanoo:30,'Black Flash':35,Sharingan:25,'Ultra Instinct':35,'Domain Expansion':40};
  const cost=costs[skill];if(!cost)return {ok:false,error:'UNKNOWN_SKILL',battle};
  if(battle.player.energy<cost)return {ok:false,error:'LOW_ENERGY',battle};
  let amount=damage(battle.player.atk,battle.enemy.def),enemy={...battle.enemy},player={...battle.player,energy:battle.player.energy-cost};
  if(skill==='Rasengan')amount=Math.floor(amount*2);
  if(skill==='Chidori')amount=Math.floor(amount*2.4);
  if(skill==='Black Flash')amount=Math.floor(amount*(crit()?3:1));
  if(skill==='Shadow Clone')amount=Math.floor(amount*1.7);
  if(skill==='Amaterasu'){amount=Math.floor(amount*1.4);enemy={...enemy,burn:3};}
  if(skill==='Susanoo')player={...player,guardTurns:3};
  if(skill==='Sharingan')player={...player,dodgeBonus:Math.min(.30,(player.dodgeBonus||.05)+.15)};
  if(skill==='Ultra Instinct')player={...player,dodgeBonus:.30};
  if(skill==='Domain Expansion')player={...player,domainTurns:3};
  const next={...battle,player,enemy};
  return playerHit(next,amount,skill);
}

export function endBattleSummary(battle){return {status:battle?.status||'UNKNOWN',enemy:battle?.enemy?.name||null,hp:battle?.player?.hp||0,log:(battle?.log||[]).slice(-4)};}
