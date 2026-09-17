import { checkProgress } from './progress.js';

export async function afterGame(env,userId){return checkProgress(env,userId);}
export async function afterCollection(env,userId){return checkProgress(env,userId);}
export async function afterAccountSetup(env,userId){return checkProgress(env,userId);}
