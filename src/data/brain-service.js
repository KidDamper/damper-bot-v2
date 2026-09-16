import { BRAIN_BANK } from './brain-expanded.js';
const norm=s=>String(s??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
export function pickQuestion(category='trivia',difficulty=null){const pool=BRAIN_BANK[category]||BRAIN_BANK.trivia;const filtered=difficulty?pool.filter(x=>x.d===difficulty):pool;return filtered[Math.floor(Math.random()*filtered.length)];}
export function answerQuestion(question,answer){if(!question)return false;const a=norm(answer);return question.a.some(x=>norm(x)===a);}
export function rewardQuestion(question,correct){const xp=correct?(question.d==='HARD'?15:question.d==='MEDIUM'?10:5):2;const coins=correct?(question.d==='HARD'?250:question.d==='MEDIUM'?150:100):0;return{coins,xp};}
