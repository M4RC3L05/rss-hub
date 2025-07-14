-- migrate:up
CREATE INDEX idx_feed_item_created_at ON feed_items(created_at);

CREATE INDEX idx_feed_item_feed_id_created_at ON feed_items(feed_id, created_at);

CREATE INDEX idx_feed_item_readed_at_created_at ON feed_items(readed_at, created_at)
WHERE
  readed_at IS NULL;

CREATE INDEX idx_feed_item_bookmarked_at_created_at ON feed_items(bookmarked_at, created_at)
WHERE
  bookmarked_at IS NOT NULL;

-- migrate:down
