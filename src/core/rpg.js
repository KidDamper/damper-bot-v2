const enemy=(name,tier,level,hp,atk,def,speed)=>({name,tier,level,hp,atk,def,speed});

export const RPG={maxLevel:50,base:{hp:100,atk:20,def:10,energy:50,speed:10},enemies:[
  enemy('Training Dummy','EASY',1,60,10,5,6),
  enemy('Street Beast','EASY',5,110,16,8,10),
  enemy('Iron Warden','MEDIUM',12,230,28,16,14),
  enemy('Shadow Ronin','HARD',20,420,44,25,20),
  enemy('Void Knight','ELITE',30,700,65,38,27),
  enemy('Blood Beast','BOSS',35,1000,75,48,25),
  enemy('Thunder Oni','BOSS',40,1200,88,55,30),
  enemy('Cursed Seer','BOSS',45,1450,100,62,35),
  enemy('Void Emperor','BOSS',50,1800,120,70,40)
]};

export function rpgStats(level=1){const l=Math.max(1,Math.min(RPG.maxLevel,level));return{hp:100+5*(l-1),atk:20+(l-1),def:10+Math.floor((l-1)/2),energy:50+2*(l-1),speed:10+Math.floor((l-1)/5)};}
export function damage(atk,def){return Math.max(1,Math.floor(atk-def/2));}
export function crit(){return Math.random()<0.10;}
export function dodge(base=0.05){return Math.random()<Math.min(0.30,base);}
export function runSuccess(){return Math.random()<0.70;}
export const LEVEL_UP_COSTS={2:[100,1000],3:[250,2000],4:[450,4000],5:[700,7000],6:[1000,10000],7:[1400,15000],8:[1900,22000],9:[2500,30000],10:[3200,40000]};
export function levelCost(level){if(level<2||level>RPG.maxLevel)return null;if(LEVEL_UP_COSTS[level])return LEVEL_UP_COSTS[level];const xp=Math.floor(3200*Math.pow(1.45,level-10)),coins=Math.floor(40000*Math.pow(1.5,level-10));return[xp,coins];}
