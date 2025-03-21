CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) primary key);
CREATE TABLE categories (
  id text PRIMARY KEY NOT NULL DEFAULT (uuid_v4()),
  name text NOT NULL UNIQUE,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) strict,
without rowid;
CREATE TRIGGER "categories_update_updated_at"
AFTER
UPDATE
  ON categories FOR each ROW
  WHEN new.updated_at = old.updated_at
BEGIN
UPDATE
  categories
SET
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  id = old.id;

END;
CREATE TABLE feeds (
  id text PRIMARY KEY NOT NULL DEFAULT (uuid_v4()),
  name text NOT NULL,
  url text UNIQUE NOT NULL,
  category_id text NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
) strict,
without rowid;
CREATE TRIGGER "feeds_update_updated_at"
AFTER
UPDATE
  ON feeds FOR each ROW
  WHEN new.updated_at = old.updated_at
BEGIN
UPDATE
  feeds
SET
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  id = old.id;

END;
CREATE INDEX idx_feeds_category_id ON feeds (category_id);
CREATE TABLE IF NOT EXISTS "feed_items" (
  id text NOT NULL DEFAULT (uuid_v4()),
  title text NOT NULL,
  enclosure text,
  link text,
  img text,
  content text NOT NULL,
  feed_id text NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  readed_at text, bookmarked_at text,
  FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE,
  PRIMARY KEY (id, feed_id)
) strict;
CREATE TRIGGER "feed_items_update_updated_at"
AFTER
UPDATE
  ON feed_items FOR each ROW
  WHEN new.updated_at = old.updated_at
BEGIN
UPDATE
  feed_items
SET
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  id = old.id;

END;
CREATE INDEX idx_feed_items_feed_id ON feed_items (feed_id);
CREATE INDEX idx_feed_items_readed_feed_id ON feed_items(readed_at, feed_id)
WHERE
  readed_at IS NULL;
CREATE INDEX idx_feed_items_not_bookmarked_feed_id ON feed_items(feed_id, bookmarked_at)
WHERE
  bookmarked_at IS NOT NULL;
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20230503122557'),
  ('20230503122558'),
  ('20230509221423'),
  ('20230526124802'),
  ('20230729100327'),
  ('20231026180404'),
  ('20240108212136'),
  ('20240526105311'),
  ('20240609000229'),
  ('20250119150455'),
  ('20250321214755');
