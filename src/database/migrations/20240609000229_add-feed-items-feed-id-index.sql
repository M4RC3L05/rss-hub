-- migrate:up

create index idx_feed_items_feed_id on feed_items(feed_id);

-- migrate:down

