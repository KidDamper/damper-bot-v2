import { RPG, rpgStats, damage, crit, dodge, runSuccess } from './rpg.js';

export function createBattle(level=1, enemyIndex=null){
  const stats=rpgStats(level);
  const pool=RPG.enemies.filter(e=>e.level<=Math.min(50,level+5));
  const enemy=enemyIndex==null?(pool[Math.floor(Math.random()*pool.length)]||RPG.enemies[0]):RPG.enemies[enemyIndex]||RPG.enemies[0];
  return {level,player:{hp:stats.hp,maxHp:stats.hp,atk:stats.atk,def:stats.def,energy:stats.energy,maxEnergy:stats.energy,speed:stats.speed,defending:false},enemy:{...enemy,maxHp:enemy.hp},turn:'PLAYER',status:'ACTIVE',log:[]};
}

function enemyTurn(battle){
  const incoming=damage(battle.enemy.atk,battle.player.def);
  const amount=battle.player.defending?Math.floor(incoming/2):incoming;
  const hp=Math.max(0,battle.player.hp-amount);
  const player={...battle.player,hp,defending:false,energy:Math.min(battle.player.maxEnergy,battle.player.energy+10)};
  return {...battle,player,turn:hp<=0?null:'PLAYER',status:hp<=0?'LOST':'ACTIVE',log:[...battle.log,`Enemy dealt ${amount} damage.`]};
}

export function playerAttack(battle){
  if(!battle||battle.status!=='ACTIVE'||battle.turn!=='PLAYER')return {ok:false,error:'NOT_PLAYER_TURN',battle};
  const missed=dodge(battle.player.dodgeBonus??0.05);
  if(missed)return enemyTurn({...battle,log:[...battle.log,'Player attack missed.']});
  const isCrit=crit();let amount=damage(battle.player.atk,battle.enemy.def);if(isCrit)amount=Math.floor(amount*1.5);
  const enemy={...battle.enemy,hp:Math.max(0,battle.enemy.hp-amount)};
  const next={...battle,enemy,log:[...battle.log,`Player dealt ${amount}${isCrit?' critical':''} damage.`]};
  if(enemy.hp<=0)return {...next,status:'WON',turn:null};
  return enemyTurn(next);
}

export function playerDefend(battle){
  if(!battle||battle.status!=='ACTIVE'||battle.turn!=='PLAYER')return {ok:false,error:'NOT_PLAYER_TURN',battle};
  return enemyTurn({...battle,player:{...battle.player,defending:true},log:[...battle.log,'Player is defending.']});
}

export function playerRun(battle){
  if(!battle||battle.status!=='ACTIVE'||battle.turn!=='PLAYER')return {ok:false,error:'NOT_PLAYER_TURN',battle};
  if(battle.enemy.tier==='BOSS')return enemyTurn({...battle,log:[...battle.log,'The boss cannot be escaped.']});
  if(runSuccess())return {...battle,status:'ESCAPED',turn:null,log:[...battle.log,'Player escaped successfully.']};
  return enemyTurn({...battle,log:[...battle.log,'Escape failed.']});
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
  if(skill==='Sharingan')player={...player,dodgeBonus:0.2};
  if(skill==='Ultra Instinct')player={...player,dodgeBonus:0.3};
  if(skill==='Domain Expansion')player={...player,domainTurns:3};
  enemy={...enemy,hp:Math.max(0,enemy.hp-amount)};
  const next={...battle,player,enemy,log:[...battle.log,`${skill} dealt ${amount} damage.`]};
  if(enemy.hp<=0)return {...next,status:'WON',turn:null};
  return enemyTurn(next);
}

export function endBattleSummary(battle){return {status:battle?.status||'UNKNOWN',enemy:battle?.enemy?.name||null,hp:battle?.player?.hp||0,log:(battle?.log||[]).slice(-4)};}
