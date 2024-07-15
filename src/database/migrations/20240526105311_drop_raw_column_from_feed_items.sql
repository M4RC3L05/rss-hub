-- migrate:up

alter table feed_items drop column raw;

-- migrate:down
