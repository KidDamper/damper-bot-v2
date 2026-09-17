import { BRAIN_BANK } from '../data/brain-expanded.js';

const categories=['trivia','math','anagram','emoji','flags'];
const pick=(arr)=>arr[Math.floor(Math.random()*arr.length)];

export function brainCategories(){return [...categories];}

export function nextQuestion(category='trivia'){
  const key=categories.includes(String(category).toLowerCase())?String(category).toLowerCase():'trivia';
  const q=pick(BRAIN_BANK[key]);
  if(!q)return null;
  return {category:key,question:q.q,answers:q.a,difficulty:q.d,explanation:q.e};
}

export function checkBrainAnswer(question,answer){
  const got=String(answer??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
  return !!question?.answers?.some(a=>String(a).normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ')===got);
}

export function brainReward(questionOrDifficulty,correct){
  if(!correct)return {coins:0,xp:2};
  const difficulty=typeof questionOrDifficulty==='object'
    ? questionOrDifficulty?.difficulty
    : questionOrDifficulty;
  const d=String(difficulty||'EASY').toUpperCase();
  return d==='HARD'?{coins:250,xp:15}:d==='MEDIUM'?{coins:150,xp:10}:{coins:100,xp:5};
}
