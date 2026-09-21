const dbFor=(env,db)=>db||env.DB;

export async function walletBalance(env,userId,db=null){
  const dbx=dbFor(env,db);
  await dbx.prepare('INSERT OR IGNORE INTO wallets(user_id,balance) VALUES(?,500)').bind(userId).run();
  const row=await dbx.prepare('SELECT balance FROM wallets WHERE user_id=?').bind(userId).first();
  if(!row)throw Error('WALLET_NOT_FOUND');
  const balance=Number(row.balance);
  if(!Number.isFinite(balance))throw Error('WALLET_BALANCE_INVALID');
  return balance;
}

export async function walletChange(env,userId,delta,db=null){
  const dbx=dbFor(env,db);
  await walletBalance(env,userId,dbx);
  const d=Number(delta);
  if(!Number.isFinite(d)||!Number.isInteger(d))throw Error('WALLET_DELTA_INVALID');
  const changed=await dbx.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=? AND balance+?>=0').bind(d,userId,d).run();
  if(Number(changed?.meta?.changes??0)!==1)throw Error(d<0?'INSUFFICIENT':'WALLET_UPDATE_FAILED');
  const row=await dbx.prepare('SELECT balance FROM wallets WHERE user_id=?').bind(userId).first();
  const balance=Number(row?.balance??NaN);
  if(!Number.isFinite(balance))throw Error('WALLET_UPDATE_VERIFY_FAILED');
  return balance;
}
