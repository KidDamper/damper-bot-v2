export const BRAIN_BANK=[
{id:'t001',category:'TRIVIA',difficulty:'EASY',q:'What is the largest planet in our solar system?',a:['Jupiter'],e:'Jupiter is the largest planet in the solar system.'},
{id:'t002',category:'TRIVIA',difficulty:'EASY',q:'How many sides does a hexagon have?',a:['6','six'],e:'A hexagon has six sides.'},
{id:'t003',category:'TRIVIA',difficulty:'MEDIUM',q:'What is the chemical symbol for gold?',a:['Au','gold'],e:'Gold has the chemical symbol Au.'},
{id:'t004',category:'TRIVIA',difficulty:'MEDIUM',q:'Which ocean is the largest?',a:['Pacific Ocean','Pacific'],e:'The Pacific Ocean is the largest ocean.'},
{id:'t005',category:'TRIVIA',difficulty:'HARD',q:'What is the smallest prime number greater than 50?',a:['53'],e:'53 is the first prime number after 50.'},
{id:'m001',category:'MATH',difficulty:'EASY',q:'What is 12 × 8?',a:['96'],e:'12 multiplied by 8 is 96.'},
{id:'m002',category:'MATH',difficulty:'MEDIUM',q:'What is 15% of 200?',a:['30'],e:'15% of 200 equals 30.'},
{id:'m003',category:'MATH',difficulty:'HARD',q:'What is 17²?',a:['289'],e:'17 multiplied by 17 equals 289.'},
{id:'a001',category:'ANAGRAM',difficulty:'EASY',q:'Unscramble: TCA',a:['CAT'],e:'The letters form CAT.'},
{id:'a002',category:'ANAGRAM',difficulty:'MEDIUM',q:'Unscramble: RAETHE',a:['EARTH'],e:'The letters form EARTH.'},
{id:'e001',category:'EMOJI',difficulty:'EASY',q:'Guess the word: 🐝 + 🍃',a:['belief','bee leaf'],e:'The emoji clue combines a bee and a leaf.'},
{id:'f001',category:'FLAG',difficulty:'EASY',q:'Which country is represented by the flag 🇯🇵?',a:['Japan'],e:'The flag shown is Japan’s national flag.'}
];
export function normalizeAnswer(v){return String(v??'').trim().normalize('NFKC').toLowerCase();}
export function checkAnswer(q,input){const x=normalizeAnswer(input);return q.a.some(a=>normalizeAnswer(a)===x);}
export function pickBrain(category){const pool=BRAIN_BANK.filter(q=>!category||q.category===category);return pool[Math.floor(Math.random()*pool.length)];}
export function brainReward(difficulty,correct){if(!correct)return {coins:0,xp:2};return difficulty==='HARD'?{coins:250,xp:15}:difficulty==='MEDIUM'?{coins:150,xp:10}:{coins:100,xp:5};}
