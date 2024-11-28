-- migrate:up
CREATE TABLE tmp_feed_items (
  id text NOT NULL DEFAULT (uuid_v4()),
  title text NOT NULL,
  enclosure text,
  link text,
  img text,
  content text NOT NULL,
  raw text NOT NULL,
  feed_id text NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  readed_at text,
  FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE,
  PRIMARY KEY (id, feed_id)
) strict;

INSERT INTO
  tmp_feed_items
SELECT
  *
FROM
  feed_items;

DROP TABLE feed_items;

ALTER TABLE
  tmp_feed_items RENAME TO feed_items;

CREATE trigger "feed_items_update_updated_at"
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

-- migrate:down
