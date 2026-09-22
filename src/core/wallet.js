const dbFor=(env,db)=>db||env.DB;

export async function getBalance(env,userId,db=null){
  const dbx=dbFor(env,db);
  await dbx.prepare('INSERT OR IGNORE INTO wallets(user_id,balance) VALUES(?,500)').bind(userId).run();
  const row=await dbx.prepare('SELECT balance FROM wallets WHERE user_id=?').bind(userId).first();
  if(!row)throw Error('WALLET_NOT_FOUND');
  const balance=Number(row.balance);
  if(!Number.isInteger(balance)||balance<0)throw Error('WALLET_BALANCE_INVALID');
  return balance;
}
export const walletBalance=getBalance;

export async function debit(env,userId,amount,db=null){
  const dbx=dbFor(env,db),n=Number(amount);
  if(!Number.isInteger(n)||n<0)throw Error('WALLET_AMOUNT_INVALID');
  await getBalance(env,userId,dbx);
  const r=await dbx.prepare('UPDATE wallets SET balance=balance-? WHERE user_id=? AND balance>=?').bind(n,userId,n).run();
  if(Number(r?.meta?.changes??0)!==1)throw Error('INSUFFICIENT_BALANCE');
  return getBalance(env,userId,dbx);
}

export async function credit(env,userId,amount,db=null){
  const dbx=dbFor(env,db),n=Number(amount);
  if(!Number.isInteger(n)||n<0)throw Error('WALLET_AMOUNT_INVALID');
  await getBalance(env,userId,dbx);
  const r=await dbx.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=?').bind(n,userId).run();
  if(Number(r?.meta?.changes??0)!==1)throw Error('WALLET_CREDIT_FAILED');
  return getBalance(env,userId,dbx);
}

export async function walletChange(env,userId,delta,db=null){
  const n=Number(delta);
  if(!Number.isInteger(n))throw Error('WALLET_DELTA_INVALID');
  return n<0?debit(env,userId,-n,db):credit(env,userId,n,db);
}
