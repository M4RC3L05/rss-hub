-- migrate:up

create table feeds (
  id text primary key not null default (uuid_v4()),
  name text not null,
  url text unique not null,
  category_id text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),

  foreign key(category_id) references categories(id) on delete cascade
) strict, without rowid;

create trigger "feeds_update_updated_at"
after update on feeds
for each row
when NEW.updated_at = OLD.updated_at
begin
  update feeds set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ' , 'now') where id = OLD.id;
end

-- migrate:down

