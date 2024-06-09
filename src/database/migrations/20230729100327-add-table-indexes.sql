-- migrate:up

create index idx_feeds_category_id on feeds(category_id);

-- migrate:down

