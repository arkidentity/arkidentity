-- ARK Iowa — list a study until FIVE are in, not four.
--
-- Students flake. Seating five means a study still lands on a real four once it
-- shakes out, and a study at four keeps showing "1 spot left" instead of
-- dropping off the list. At five it auto-closes (status -> full). Staff can
-- still close a study that's solidified at four by setting status = full.
--
-- Existing studies at the old default of 4 move to 5. Status is NOT touched:
-- studies already marked full stay closed until someone reopens them.

alter table bible_studies alter column capacity set default 5;

update bible_studies set capacity = 5 where capacity = 4 and status <> 'ended';
