-- Sample data for the Ministry Feed. Run AFTER 001_ministry_feed.sql to see the
-- /feed page populated during Phase 1 testing. Safe to delete these rows later.

insert into posts (status, media_type, final_text, published_at) values
(
  'published',
  'photo',
  E'We spent the morning with a group of students who showed up an hour early — not because we asked them to, but because they wanted to pray first.\n\nThat''s the kind of hunger you can''t manufacture. You just get to witness it, and thank God you had a front-row seat.',
  now() - interval '2 days'
),
(
  'published',
  'photo',
  E'Sending letters this week to every partner who has walked with us this year.\n\nNone of what happens here happens alone. Thank you for being part of the story God is writing on this campus.',
  now() - interval '9 days'
),
(
  'published',
  null,
  E'Quick update from the road: three new disciple-makers were commissioned this weekend, and each one is already praying about who they''ll invite next.\n\nMultiplication isn''t a program. It''s people saying yes, one at a time.',
  now() - interval '20 days'
);
