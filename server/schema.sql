CREATE TABLE IF NOT EXISTS launch_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  description TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  launch_type_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  launch_type_id TEXT NOT NULL,
  game_id TEXT,
  title TEXT NOT NULL,
  lesson TEXT NOT NULL,
  trigger_keywords TEXT NOT NULL,
  severity TEXT NOT NULL,
  promoted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
