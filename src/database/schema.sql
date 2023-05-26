CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) primary key);
CREATE TABLE categories (
  id text primary key not null default (uuid_v4()),
  name text not null unique,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now'))
) strict, without rowid;
CREATE TRIGGER "categories_update_updated_at"
after update on categories
for each row
when NEW.updated_at = OLD.updated_at
begin
  update categories set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ' , 'now') where id = OLD.id;
end;
CREATE TABLE feeds (
  id text primary key not null default (uuid_v4()),
  name text not null,
  url text unique not null,
  category_id text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),

  foreign key(category_id) references categories(id) on delete cascade
) strict, without rowid;
CREATE TRIGGER "feeds_update_updated_at"
after update on feeds
for each row
when NEW.updated_at = OLD.updated_at
begin
  update feeds set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ' , 'now') where id = OLD.id;
end;
CREATE TABLE IF NOT EXISTS "feed_items" (
  id text not null default (uuid_v4()),
  title text not null,
  enclosure text,
  link text,
  img text,
  content text not null,
  raw text not null,
  feed_id text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),
  readed_at text,

  foreign key(feed_id) references feeds(id) on delete cascade,
  primary key(id, feed_id)
) strict, without rowid;
CREATE TRIGGER "feed_items_update_updated_at"
after update on feed_items
for each row
when NEW.updated_at = OLD.updated_at
begin
  update feed_items set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ' , 'now') where id = OLD.id;
end;
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20230503122557'),
  ('20230503122558'),
  ('20230509221423'),
  ('20230526124802');
