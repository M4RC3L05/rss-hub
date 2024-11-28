-- migrate:up
CREATE INDEX idx_feed_items_feed_id ON feed_items (feed_id);

-- migrate:down
