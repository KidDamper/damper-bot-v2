ALTER TABLE rpg_battles ADD COLUMN reward_applied INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_rpg_battles_user_reward ON rpg_battles(user_id, reward_applied);
