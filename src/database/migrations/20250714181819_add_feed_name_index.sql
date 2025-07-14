-- migrate:up
CREATE INDEX idx_feed_items_readed_feed_id_created_at ON feed_items(readed_at, feed_id, created_at)
WHERE
  readed_at IS NULL;

CREATE INDEX idx_feed_items_not_bookmarked_feed_id_created_at ON feed_items(feed_id, bookmarked_at, created_at)
WHERE
  bookmarked_at IS NOT NULL;

-- migrate:down
