-- 048: Trick or Truth debrief v2 (Travis, 2026-11-02).
-- Built for the national launch: hundreds to thousands of volunteers.
-- Adds where they served (city, church or group), how to reach them, what God did
-- in the volunteer, more than one story, follow-up names, and photos.
-- `story` stays and holds the first story so old rows and totals keep working.

alter table iowa_outreach_debriefs
  add column if not exists email         text,
  add column if not exists phone         text,
  add column if not exists city          text,
  add column if not exists group_name    text,
  add column if not exists nervous       text,          -- what they were nervous about before
  add column if not exists in_me         text,          -- what God did in the volunteer
  add column if not exists stories       jsonb not null default '[]'::jsonb,  -- ["...", "..."]
  add column if not exists stuck         text,          -- where they got stuck
  add column if not exists follow_up     text,          -- who to follow up with, and how
  add column if not exists photos        text[] not null default '{}',        -- paths in outreach-photos
  add column if not exists photos_ok     boolean not null default false,      -- everyone pictured agreed
  add column if not exists interview_ok  boolean not null default false;      -- OK to call about their story

-- Private bucket for debrief photos. Uploads go straight from the phone with a
-- signed URL minted server-side; staff view them through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('outreach-photos', 'outreach-photos', false)
on conflict (id) do nothing;
