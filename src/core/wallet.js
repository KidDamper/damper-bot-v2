const sessionFor=(env,db)=>db||env.DB.withSession('first-primary');

export async function walletBalance(env,userId,db=null){
  const session=sessionFor(env,db);
  await session.prepare('INSERT OR IGNORE INTO wallets(user_id,balance) VALUES(?,500)').bind(userId).run();
  const row=await session.prepare('SELECT balance FROM wallets WHERE user_id=?').bind(userId).first();
  if(!row)throw Error('WALLET_NOT_FOUND');
  const balance=Number(row.balance);
  if(!Number.isFinite(balance))throw Error('WALLET_BALANCE_INVALID');
  return balance;
}

export async function walletChange(env,userId,delta,db=null){
  const session=sessionFor(env,db);
  await walletBalance(env,userId,session);
  const d=Number(delta);
  if(!Number.isFinite(d)||!Number.isInteger(d))throw Error('WALLET_DELTA_INVALID');
  const changed=await session.prepare('UPDATE wallets SET balance=balance+? WHERE user_id=? AND balance+?>=0').bind(d,userId,d).run();
  if(Number(changed?.meta?.changes??0)!==1)throw Error(d<0?'INSUFFICIENT':'WALLET_UPDATE_FAILED');
  return walletBalance(env,userId,session);
}
