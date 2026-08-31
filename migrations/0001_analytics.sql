CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_view_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '/',
  source TEXT NOT NULL DEFAULT 'Directo',
  device TEXT NOT NULL CHECK (device IN ('desktop', 'mobile', 'tablet')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
ON analytics_events(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_created_at
ON analytics_events(event_name, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_page_view
ON analytics_events(page_view_id);

PRAGMA optimize;
