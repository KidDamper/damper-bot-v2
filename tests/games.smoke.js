import assert from 'node:assert/strict';
import { validateStake, penaltyMultiplier, minesMultiplier } from '../src/core/game-rules.js';
import { newMinesGame, openMine } from '../src/games/mines.js';

assert.equal(validateStake(49,500),false);
assert.equal(validateStake(50,500),true);
assert.equal(penaltyMultiplier('left'),2);
assert.equal(penaltyMultiplier('top-right'),3);
assert.equal(minesMultiplier(9),8);
const game=newMinesGame();
assert.equal(game.mines.length,3);
assert.equal(game.opened.length,0);
for(const mine of game.mines) assert.equal(game.mines.includes(mine),true);
const mineResult=openMine(game,game.mines[0]);
assert.equal(mineResult.mine,true);
assert.equal(mineResult.state.active,false);
console.log('Damper game smoke checks passed');
