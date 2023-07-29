-- migrate:up

create index idx_feeds_category_id on feeds(category_id);
create index idx_feed_items_feed_id on feed_items(feed_id);

-- migrate:down

