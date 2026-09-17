const METRICS={
  coins:{label:'RICHEST',column:'w.balance'},
  xp:{label:'XP',column:'x.damper_xp'},
  wins:{label:'WINS',column:'s.games_won'},
  games:{label:'GAMES',column:'s.games_played'},
  rpg:{label:'RPG',column:'x.rpg_xp'},
  collector:{label:'COLLECTOR',column:'collection_count'}
};

export function safeMetric(name){return METRICS[String(name||'').toLowerCase()]||null;}
export function safeMetricNames(){return Object.keys(METRICS);}
