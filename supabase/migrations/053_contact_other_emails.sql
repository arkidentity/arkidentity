-- 053: Other emails and phones (Travis, 2026-11-03).
-- One main email and phone (what newsletters and texts use, and what's listed
-- first in Google) plus any others the person has. Merging never drops an
-- address any more, and every lookup (sync, sign-ups, prayer) matches on all
-- of them. merge_contacts is replaced to carry both lists.

alter table contacts
  add column if not exists other_emails text[] not null default '{}',
  add column if not exists other_phones text[] not null default '{}';

create index if not exists contacts_other_emails_idx on contacts using gin (other_emails);

create or replace function merge_contacts(keep uuid, lose uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  k contacts%rowtype;
  l contacts%rowtype;
  fk record;
  rid tid;
begin
  if keep = lose then raise exception 'Pick two different people.'; end if;
  select * into k from contacts where id = keep for update;
  select * into l from contacts where id = lose for update;
  if k.id is null or l.id is null then raise exception 'One of those contacts no longer exists.'; end if;

  -- Repoint every referencing row, one at a time so a collision drops only
  -- that row.
  for fk in
    select cl.relname as tbl, att.attname as col
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    join pg_namespace ns on ns.oid = cl.relnamespace and ns.nspname = 'public'
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.confrelid = 'public.contacts'::regclass
      and array_length(con.conkey, 1) = 1
  loop
    for rid in execute format('select ctid from %I where %I = $1', fk.tbl, fk.col) using lose loop
      begin
        execute format('update %I set %I = $1 where ctid = $2', fk.tbl, fk.col) using keep, rid;
      exception when unique_violation then
        execute format('delete from %I where ctid = $1', fk.tbl) using rid;
      end;
    end loop;
  end loop;

  -- Unique columns move off lose before keep can take them.
  update contacts set email = null, google_resource_name = null where id = lose;

  if k.google_resource_name is not null and l.google_resource_name is not null
     and k.google_resource_name <> l.google_resource_name then
    insert into google_merged_away (resource_name, merged_into)
    values (l.google_resource_name, keep)
    on conflict (resource_name) do update set merged_into = excluded.merged_into, merged_at = now();
  end if;

  update contacts set
    email                = coalesce(k.email, l.email),
    phone                = coalesce(k.phone, l.phone),
    -- Nothing is dropped: every address and number either one had that isn't
    -- the keeper's main one goes on the "other" lists.
    other_emails         = array(
      select distinct e from unnest(
        array[k.email, l.email] || coalesce(k.other_emails, '{}') || coalesce(l.other_emails, '{}')
      ) as e
      where e is not null and e <> coalesce(k.email, l.email)
    ),
    other_phones         = array(
      select distinct p from unnest(
        array[k.phone, l.phone] || coalesce(k.other_phones, '{}') || coalesce(l.other_phones, '{}')
      ) as p
      where p is not null and p <> coalesce(k.phone, l.phone)
    ),
    city                 = coalesce(k.city, l.city),
    state                = coalesce(k.state, l.state),
    region               = coalesce(k.region, l.region),
    church               = coalesce(k.church, l.church),
    birthday             = coalesce(k.birthday, l.birthday),
    source               = coalesce(k.source, l.source),
    relationship_notes   = nullif(concat_ws(E'\n', k.relationship_notes, l.relationship_notes), ''),
    subscribed           = k.subscribed or l.subscribed,
    on_phone             = k.on_phone or l.on_phone,
    google_resource_name = coalesce(k.google_resource_name, l.google_resource_name),
    google_etag          = case when k.google_resource_name is null then l.google_etag else k.google_etag end,
    -- Keep the snapshot that matches the Google link we keep. Tags that came
    -- over from the other person aren't in it, so the next sync reads them as
    -- added in ARK and labels them in Google (not as removals).
    google_labels_synced = case
      when k.google_resource_name is null then l.google_labels_synced
      else k.google_labels_synced end,
    status               = case when k.status = 'active' or l.status = 'active' then 'active' else k.status end,
    created_at           = least(k.created_at, l.created_at),
    updated_at           = now()
  where id = keep;

  insert into contact_sync_log (contact_id, action, detail)
  values (keep, 'merged', concat_ws(' · ', l.name, l.email, l.phone));

  delete from contacts where id = lose;
end;
$$;

revoke all on function merge_contacts(uuid, uuid) from public, anon, authenticated;
grant execute on function merge_contacts(uuid, uuid) to service_role;
