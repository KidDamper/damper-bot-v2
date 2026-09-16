export function coinFlip(){return Math.random()<0.5?'HEADS':'TAILS';}
export function dice(){return 1+Math.floor(Math.random()*6);}
export function diceDuel(){const a=dice(),b=dice();return {a,b,outcome:a>b?'WIN':a<b?'LOSS':'DRAW'};}
export function penalty(direction){const keeper=['left','right','center','top-left','top-right'][Math.floor(Math.random()*5)];return {keeper,outcome:keeper===direction?'SAVE':'GOAL'};}
export function slots(){const symbols=['🍒','🍋','🔔','⭐','7️⃣'];const r=[0,0,0].map(()=>symbols[Math.floor(Math.random()*symbols.length)]);const counts=Object.fromEntries(symbols.map(s=>[s,r.filter(x=>x===s).length]));const special=r.includes('7️⃣')&&counts['7️⃣']===2;const jackpot=counts['7️⃣']===3;const match=Math.max(...Object.values(counts));return {roll:r,kind:jackpot?'JACKPOT':special?'SPECIAL':match===3?'THREE':match===2?'TWO':'NONE'};}
export function minesBoard(){const mines=new Set();while(mines.size<3)mines.add(Math.floor(Math.random()*12));return [...mines];}
export function race(){const rolls=[0,1,2,3].map(()=>Math.random());return rolls.map((v,i)=>({player:i+1,score:v})).sort((a,b)=>b.score-a.score);}
