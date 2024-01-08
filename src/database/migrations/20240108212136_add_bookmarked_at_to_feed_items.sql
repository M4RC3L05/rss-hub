-- migrate:up

alter table feed_items add column bookmarked_at text;

-- migrate:down

