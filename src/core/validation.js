export const MIN_WAGER = 50;

export function integerAmount(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

export function validWager(value, balance) {
  const n = integerAmount(value);
  if (n === null || n < MIN_WAGER) return {ok:false,reason:"MIN_WAGER"};
  if (n > balance) return {ok:false,reason:"INSUFFICIENT"};
  return {ok:true,value:n};
}

export function normalizeAnswer(value) {
  return String(value ?? "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g," ");
}

export function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }
