-- migrate:up
ALTER TABLE
  feed_items
ADD
  COLUMN bookmarked_at text;

-- migrate:down
