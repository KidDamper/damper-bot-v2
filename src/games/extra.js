export function anagram(word){return String(word||'').split('').sort(()=>Math.random()-0.5).join('');}
export function emojiGuess(){const bank=[{emoji:'🐘',answer:'elephant'},{emoji:'🍕',answer:'pizza'},{emoji:'🌧️',answer:'rain'},{emoji:'🚀',answer:'rocket'},{emoji:'⚽',answer:'football'}];return bank[Math.floor(Math.random()*bank.length)];}
export function flagQuiz(){const bank=[{flag:'🇳🇬',answer:'nigeria'},{flag:'🇯🇵',answer:'japan'},{flag:'🇧🇷',answer:'brazil'},{flag:'🇫🇷',answer:'france'},{flag:'🇨🇦',answer:'canada'}];return bank[Math.floor(Math.random()*bank.length)];}
export function mathQuestion(){const a=2+Math.floor(Math.random()*18),b=2+Math.floor(Math.random()*18);return {question:`${a} × ${b} = ?`,answer:String(a*b)};}
export function sequenceQuestion(){const start=2+Math.floor(Math.random()*10),step=2+Math.floor(Math.random()*8);const values=[start,start+step,start+2*step,start+3*step];return {values,answer:start+4*step};}
export function reactionTarget(){const words=['DAMPER','KIDDAMPER','V2','GO','LIGHTNING'];return words[Math.floor(Math.random()*words.length)];}
export function truthOrDare(){return {truth:['What is a skill you wish you were better at?','What is your most-used app?','What is one goal you have this year?'],dare:['Send a funny emoji combo.','Type your next message using only emojis.','Change your profile status for five minutes.']};}
