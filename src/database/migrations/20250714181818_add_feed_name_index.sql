-- migrate:up
CREATE INDEX idx_feed_name ON feeds(name COLLATE nocase);

-- migrate:down
