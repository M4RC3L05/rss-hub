-- migrate:up
CREATE INDEX idx_feeds_category_id ON feeds (category_id);

-- migrate:down
