export const MODERATION_MESSAGES={
 WARN:'⚠️ A moderation warning has been issued.',
 SILENCE:'🔇 This member has been silenced by moderation.',
 REMOVE:'🚫 This member has been removed by moderation.',
 LOCK:'🔒 Group interactions are temporarily locked.',
 UNLOCK:'🔓 Group interactions are unlocked again.'
};

export function moderationMessage(action){return MODERATION_MESSAGES[String(action||'').toUpperCase()]||'🛡️ Moderation action completed.';}
