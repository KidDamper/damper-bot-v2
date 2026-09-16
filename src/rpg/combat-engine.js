import { rpgStats, damage, crit, dodge, runSuccess } from '../core/rpg.js';

export function createBattle(playerLevel,enemy){const p=rpgStats(playerLevel);return {player:{...p},enemy:{...enemy,maxHp:enemy.hp},turn:1,defending:false,ended:false};}
export function playerAttack(state){if(state.ended)return state;let d=damage(state.player.atk,state.enemy.def);const critical=crit();if(critical)d=Math.floor(d*1.5);state.enemy.hp=Math.max(0,state.enemy.hp-d);if(state.enemy.hp<=0){state.ended=true;return {...state,last:{type:'attack',damage:d,critical,enemyDefeated:true}}}return enemyTurn({...state,last:{type:'attack',damage:d,critical}});}
export function defend(state){if(state.ended)return state;return enemyTurn({...state,defending:true,last:{type:'defend'}});}
export function enemyTurn(state){let incoming=damage(state.enemy.atk,state.player.def);const dodged=dodge();if(dodged)incoming=0;if(state.defending)incoming=Math.floor(incoming/2);state.player.hp=Math.max(0,state.player.hp-incoming);const ended=state.player.hp<=0;return {...state,ended,last:{...(state.last||{}),incoming,dodged,playerDefeated:ended},defending:false,turn:state.turn+1};}
export function tryRun(state,isBoss=false){if(isBoss)return {ok:false,state,last:{type:'run',success:false}};const success=runSuccess();return {ok:success,state:{...state,ended:success},last:{type:'run',success}};}
