-- migrate:up

create table categories (
  id text primary key not null default (uuid_v4()),
  name text not null unique,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now'))
) strict, without rowid;

create trigger "categories_update_updated_at"
after update on categories
for each row
when NEW.updated_at = OLD.updated_at
begin
  update categories set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ' , 'now') where id = OLD.id;
end

-- migrate:down

