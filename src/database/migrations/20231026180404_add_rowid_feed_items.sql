-- migrate:up

create table tmp_feed_items (
  id text not null default (uuid_v4()),
  title text not null,
  enclosure text,
  link text,
  img text,
  content text not null,
  raw text not null,
  feed_id text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  readed_at text,

  foreign key (feed_id) references feeds (id) on delete cascade,
  primary key (id, feed_id)
) strict;

insert into tmp_feed_items
select * from feed_items; -- noqa: AM04

drop table feed_items;

alter table tmp_feed_items rename to feed_items;

create trigger "feed_items_update_updated_at"
after update on feed_items
for each row
when new.updated_at = old.updated_at
begin
update feed_items set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
where id = old.id;
end;


-- migrate:down
