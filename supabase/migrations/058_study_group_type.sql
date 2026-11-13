-- 058: Guys / Girls / Co-ed Bible studies (Travis, 2026-11-13).
-- Each study says who it's for; the signup page asks "guy or girl?" so a guy is never
-- offered a girls' study and the other way round. Co-ed studies are open to everyone.
-- Every existing study starts as co-ed; set the real ones in the admin.

alter table bible_studies
  add column if not exists group_type text not null default 'coed'
  check (group_type in ('guys','girls','coed'));

-- What the student told us on the signup page. Null = they didn't say.
alter table campus_students
  add column if not exists gender text check (gender in ('guy','girl'));
