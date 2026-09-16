CREATE TABLE IF NOT EXISTS wagers (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  game_type TEXT NOT NULL,
  stake INTEGER NOT NULL,
  payout INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'PENDING',
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_wagers_user_time ON wagers(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wagers_game_time ON wagers(game_type, created_at);

INSERT OR IGNORE INTO cards (id,name,tier,price) VALUES
('card_common_01','Signal Runner','COMMON',2500),
('card_common_02','Coin Drifter','COMMON',2500),
('card_common_03','Night Coder','COMMON',2500),
('card_rare_01','Chrome Phantom','RARE',10000),
('card_rare_02','Neon Oracle','RARE',10000),
('card_rare_03','Vault Keeper','RARE',10000),
('card_mythic_01','The Unseen','MYTHIC',40000),
('card_mythic_02','Null Walker','MYTHIC',40000),
('card_mythic_03','Final Signal','MYTHIC',40000);

INSERT OR IGNORE INTO pets (id,name,tier,price,luck) VALUES
('pet_lucky_cat','Lucky Cat','COMMON',5000,1),
('pet_kitsune','Kitsune','RARE',20000,2),
('pet_ancient_dragon','Ancient Dragon','LEGENDARY',125000,3),
('pet_void_dragon','Void Dragon','MYTHIC',300000,4);
