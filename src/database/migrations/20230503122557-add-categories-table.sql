-- migrate:up
CREATE TABLE categories (
  id text PRIMARY KEY NOT NULL DEFAULT (uuid_v4()),
  name text NOT NULL UNIQUE,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) strict,
without rowid;

CREATE trigger "categories_update_updated_at"
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

END
--
-- migrate:down
