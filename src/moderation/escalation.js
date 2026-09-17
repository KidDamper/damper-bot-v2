const ORDER=['WARN','SILENCE','REMOVE'];

export function nextEscalation(warnings=0){
  const n=Math.max(0,Number(warnings)||0);
  if(n>=3)return 'REMOVE';
  if(n>=2)return 'SILENCE';
  return 'WARN';
}

export function escalationPlan(history=[]){
  const warnings=history.filter(x=>String(x.action||'').toUpperCase()==='WARN').length;
  const action=nextEscalation(warnings);
  return {warnings,action,sequence:ORDER};
}
