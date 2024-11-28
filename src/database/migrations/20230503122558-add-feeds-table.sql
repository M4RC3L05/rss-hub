-- migrate:up
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

CREATE trigger "feeds_update_updated_at"
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

END
--
-- migrate:down
