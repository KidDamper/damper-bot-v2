import { safeGameRoute, runSafeGameAction } from './safe-router.js';
import { createSafeState, updateSafeState, safeStateExpired, safeGameSummary } from './safe-game-state.js';

const TTL = 10 * 60 * 1000;

export function bridgeSafeCallback(callbackData = '') {
  const route = safeGameRoute(callbackData);
  if (!route) return null;
  return { ok: true, route };
}

export function beginSafeGame(game, extra = {}) {
  return createSafeState(game, extra);
}

export function advanceSafeGame(state, patch = {}, now = Date.now()) {
  if (!state || safeStateExpired(state, TTL, now)) {
    return { ok: false, error: 'EXPIRED', state: null };
  }
  return { ok: true, state: updateSafeState(state, patch) };
}

export function executeSafeCallback(callbackData, options = {}) {
  const route = safeGameRoute(callbackData);
  if (!route) return null;

  const state = options.state || null;
  const now = options.now ?? Date.now();

  if (state && safeStateExpired(state, TTL, now)) {
    return { ok: false, error: 'EXPIRED', route, state: null };
  }

  const result = runSafeGameAction(route, {
    state,
    userId: options.userId ?? null,
    now,
    players: options.players || []
  });

  return {
    ok: true,
    route,
    result,
    summary: result?.state ? safeGameSummary(result.state) : null
  };
}

export function safeCallbackHelp() {
  return 'Safe game bridge: social and reaction callbacks only.';
}
