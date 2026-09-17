const q=(id,category,difficulty,prompt,answers,explanation='')=>({id,category,difficulty,prompt,answers,explanation});

export const BRAIN_BANK=[
 q('trivia_001','TRIVIA','easy','Which planet is known as the Red Planet?',['Mars'],'Mars is commonly known as the Red Planet because of its reddish appearance.'),
 q('trivia_002','TRIVIA','easy','How many days are in a standard week?',['7'],'A standard week contains seven days.'),
 q('trivia_003','TRIVIA','medium','What is the largest ocean on Earth?',['Pacific Ocean','Pacific'],'The Pacific Ocean is the largest ocean on Earth.'),
 q('trivia_004','TRIVIA','medium','Which gas do plants primarily absorb during photosynthesis?',['Carbon dioxide','CO2'],'Plants use carbon dioxide during photosynthesis.'),
 q('math_001','MATH','easy','What is 12 × 8?',['96'],'12 multiplied by 8 equals 96.'),
 q('math_002','MATH','easy','What is 144 ÷ 12?',['12'],'144 divided by 12 equals 12.'),
 q('math_003','MATH','medium','What is 15% of 200?',['30'],'Fifteen percent of 200 is 30.'),
 q('math_004','MATH','hard','What is 17² − 13²?',['120'],'Using the difference of squares, 17² minus 13² equals 120.'),
 q('anagram_001','ANAGRAM','easy','Unscramble: LPAEP',['APPLE'],'The letters form APPLE.'),
 q('anagram_002','ANAGRAM','medium','Unscramble: NIGERIA',['NIGERIA'],'The letters are already arranged as NIGERIA.'),
 q('emoji_001','EMOJI','easy','Which word is represented by 🌧️?',['Rain'],'The cloud with falling drops represents rain.'),
 q('emoji_002','EMOJI','medium','Which phrase is represented by 🐝 + 🏠?',['Bee house','Beehive'],'The intended phrase points to a bee home, commonly called a beehive.'),
 q('flag_001','FLAGS','easy','Which country uses a green-white-green vertical flag?',['Nigeria'],'Nigeria’s national flag has green, white, and green vertical bands.'),
 q('flag_002','FLAGS','medium','Which country has a maple leaf on its flag?',['Canada'],'Canada’s flag features a maple leaf.'),
];

export function brainBank(){return BRAIN_BANK.slice();}
