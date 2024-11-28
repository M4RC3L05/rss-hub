-- migrate:up
ALTER TABLE
  feed_items DROP COLUMN raw;

-- migrate:down
