-- Ministry Feed — Phase 3 (revised): direct multi-media upload in /admin.
--
-- An update can bundle several photos, a video, and a transcript — all captured
-- in one admin composer submission (no Google Drive; files upload straight to
-- Supabase Storage via signed URLs). `media` holds the ordered gallery.
--
-- Each element: { "url": "<public url>", "type": "photo" | "video" | "audio" }
-- The legacy single-media columns (raw_media_url / display_media_url /
-- media_type) remain for the seed rows and are rendered as a fallback.

alter table posts
  add column if not exists media jsonb not null default '[]'::jsonb;

-- The 'feed-media' PUBLIC Storage bucket is still required (create in the
-- Supabase dashboard, or:
--   insert into storage.buckets (id, name, public)
--   values ('feed-media', 'feed-media', true)
--   on conflict (id) do nothing;
-- Uploads are authorized per-file by signed upload URLs minted server-side with
-- the service-role key, so no broad storage insert policy is needed.
