CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cooldowns (
  user_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, key),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS stats (
  user_id INTEGER PRIMARY KEY,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  games_lost INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  coins_lost INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  wager_games INTEGER NOT NULL DEFAULT 0,
  total_staked INTEGER NOT NULL DEFAULT 0,
  total_won INTEGER NOT NULL DEFAULT 0,
  total_lost INTEGER NOT NULL DEFAULT 0,
  biggest_stake INTEGER NOT NULL DEFAULT 0,
  biggest_payout INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  game_type TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  player_id INTEGER NOT NULL,
  state TEXT NOT NULL,
  stake INTEGER NOT NULL DEFAULT 0,
  result TEXT,
  expires_at INTEGER NOT NULL,
  reward_applied INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (player_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_type TEXT NOT NULL,
  outcome TEXT NOT NULL,
  stake INTEGER NOT NULL DEFAULT 0,
  payout INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  secret INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INTEGER NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

CREATE TABLE IF NOT EXISTS titles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_titles (
  user_id INTEGER NOT NULL,
  title_id TEXT NOT NULL,
  earned_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, title_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (title_id) REFERENCES titles(id)
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL,
  price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_cards (
  user_id INTEGER NOT NULL,
  card_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, card_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (card_id) REFERENCES cards(id)
);

CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL,
  price INTEGER NOT NULL,
  luck INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_pets (
  user_id INTEGER NOT NULL,
  pet_id TEXT NOT NULL,
  PRIMARY KEY (user_id, pet_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (pet_id) REFERENCES pets(id)
);

CREATE TABLE IF NOT EXISTS numbered_items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_numbered_items (
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  discovered_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES numbered_items(id)
);

CREATE TABLE IF NOT EXISTS rpg_profiles (
  user_id INTEGER PRIMARY KEY,
  hp INTEGER NOT NULL DEFAULT 100,
  atk INTEGER NOT NULL DEFAULT 20,
  def INTEGER NOT NULL DEFAULT 10,
  energy INTEGER NOT NULL DEFAULT 50,
  speed INTEGER NOT NULL DEFAULT 10,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rpg_inventory (
  user_id INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rpg_equipment (
  user_id INTEGER PRIMARY KEY,
  weapon_id TEXT,
  armor_id TEXT,
  accessory_id TEXT,
  skill_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rpg_battles (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  enemy_id TEXT NOT NULL,
  enemy_hp INTEGER NOT NULL,
  enemy_atk INTEGER NOT NULL,
  enemy_def INTEGER NOT NULL,
  player_hp INTEGER NOT NULL,
  player_energy INTEGER NOT NULL,
  turn INTEGER NOT NULL DEFAULT 1,
  state TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS groups (
  group_id TEXT PRIMARY KEY,
  group_name TEXT,
  owner_id TEXT,
  approved INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  approved_at INTEGER
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  moderator_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_results_user_time ON game_results(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_users_damper_id ON users(damper_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

INSERT OR IGNORE INTO achievements (id,name,description,secret) VALUES
('getting_started','Getting Started','Create your Damper account.',0),
('first_daily','Daily Grind','Claim your first daily reward.',0),
('first_win','First Win','Win your first game.',0),
('first_goal','First Goal','Score your first penalty goal.',0),
('millionaire','Millionaire','Reach 1,000,000 Damper Coins.',0),
('first_card','First Card','Obtain your first card.',0),
('pet_owner','Pet Owner','Own your first pet.',0),
('number_hunter','Number Hunter','Discover your first numbered item.',0),
('collector','Collector','Own at least 10 distinct collection items.',0),
('level_10','Experienced','Reach Damper Level 10.',0),
('level_50','Veteran Player','Reach Damper Level 50.',0);

INSERT OR IGNORE INTO numbered_items (id,name,rarity,description) VALUES
(1,'The First Signal','Mythic','A silent mark that appears only to persistent collectors.'),
(2,'Obsidian Thread','Mythic','A strange thread connecting the Damper systems.'),
(3,'Glass Crown','Legendary','A fragile-looking crown with impossible durability.'),
(4,'Null Coin','Legendary','A coin whose face never shows the same symbol twice.'),
(5,'Red Index','Legendary','An artifact that records a number no one remembers writing.'),
(6,'Moon Key','Legendary','A key with no known lock.'),
(7,'Silent Dice','Mythic','A die that seems to avoid ordinary probability.'),
(8,'Black Ticket','Mythic','A ticket stamped with an unknown destination.'),
(9,'Fourth Wall Token','Mythic','A token that feels strangely aware of the Vault.'),
(10,'Hollow Medal','Legendary','A medal awarded for an achievement not yet understood.'),
(11,'Blue Scarab','Legendary','A small relic carrying an old electric-blue mark.'),
(12,'Last Match','Mythic','A match that refuses to reveal what it can ignite.'),
(13,'Eclipse Seal','Mythic','A sealed emblem that grows colder when observed.'),
(14,'Cursed Number','Mythic','A numbered relic that should not have been drawn.'),
(15,'Void Bookmark','Mythic','A bookmark with pages missing from both ends.'),
(16,'The Final Mark','Mythic','The rarest known Damper numbered artifact.');
