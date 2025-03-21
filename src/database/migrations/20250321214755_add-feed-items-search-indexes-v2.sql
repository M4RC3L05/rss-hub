-- migrate:up
DROP INDEX idx_feed_items_readed;

DROP INDEX idx_feed_items_not_bookmarked;

CREATE INDEX idx_feed_items_readed_feed_id ON feed_items(readed_at, feed_id)
WHERE
  readed_at IS NULL;

CREATE INDEX idx_feed_items_not_bookmarked_feed_id ON feed_items(feed_id, bookmarked_at)
WHERE
  bookmarked_at IS NOT NULL;

-- migrate:down
