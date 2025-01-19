-- migrate:up
CREATE INDEX idx_feed_items_readed ON feed_items(readed_at)
WHERE
  readed_at IS NULL;

CREATE INDEX idx_feed_items_not_bookmarked ON feed_items(bookmarked_at)
WHERE
  bookmarked_at IS NOT NULL;

-- migrate:down
