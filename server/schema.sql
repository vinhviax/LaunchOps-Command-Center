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

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS launches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  target_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  brief TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id TEXT PRIMARY KEY,
  launch_id TEXT NOT NULL,
  result_json TEXT NOT NULL,
  agents_trace_json TEXT NOT NULL DEFAULT '[]',
  brief_snapshot TEXT NOT NULL DEFAULT '',
  score INTEGER,
  color TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  launch_type TEXT NOT NULL,
  active_version_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS template_versions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  template_json TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS postmortems (
  id TEXT PRIMARY KEY,
  launch_id TEXT NOT NULL,
  status TEXT NOT NULL,
  post_launch_result TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons_index (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  launch_type TEXT NOT NULL,
  memory_record_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Medium',
  created_at TEXT NOT NULL
);
