export function normalizeAnswer(value){
  return String(value??'')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g,' ');
}

export function answerMatches(input,answers=[]){
  const normalized=normalizeAnswer(input);
  return answers.some(answer=>normalizeAnswer(answer)===normalized);
}
