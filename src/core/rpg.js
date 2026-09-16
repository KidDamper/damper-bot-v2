export const RPG={maxLevel:50,base:{hp:100,atk:20,def:10,energy:50,speed:10},enemies:[{name:'Training Dummy',tier:'EASY',level:1,hp:60,atk:10,def:5},{name:'Street Beast',tier:'EASY',level:5,hp:110,atk:16,def:8},{name:'Iron Warden',tier:'MEDIUM',level:12,hp:230,atk:28,def:16},{name:'Shadow Ronin',tier:'HARD',level:20,hp:420,atk:44,def:25},{name:'Void Knight',tier:'ELITE',level:30,hp:700,atk:65,def:38},{name:'Blood Beast',tier:'BOSS',level:35,hp:1000,atk:75,def:48},{name:'Thunder Oni',tier:'BOSS',level:40,hp:1200,atk:88,def:55},{name:'Cursed Seer',tier:'BOSS',level:45,hp:1450,atk:100,def:62},{name:'Void Emperor',tier:'BOSS',level:50,hp:1800,atk:120,def:70}]};
export function rpgStats(level=1){const l=Math.max(1,Math.min(RPG.maxLevel,level));return{hp:100+5*(l-1),atk:20+(l-1),def:10+Math.floor((l-1)/2),energy:50+2*(l-1),speed:10+Math.floor((l-1)/5)};}
export function damage(atk,def){return Math.max(1,Math.floor(atk-def/2));}
export function crit(){return Math.random()<0.10;}
export function dodge(base=0.05){return Math.random()<Math.min(0.30,base);}
export function runSuccess(){return Math.random()<0.70;}
export const LEVEL_UP_COSTS={2:[100,1000],3:[250,2000],4:[450,4000],5:[700,7000],6:[1000,10000],7:[1400,15000],8:[1900,22000],9:[2500,30000],10:[3200,40000]};
export function levelCost(level){if(level<2||level>RPG.maxLevel)return null;if(LEVEL_UP_COSTS[level])return LEVEL_UP_COSTS[level];const xp=Math.floor(3200*Math.pow(1.45,level-10)),coins=Math.floor(40000*Math.pow(1.5,level-10));return[xp,coins];}
