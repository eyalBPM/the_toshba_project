-- Add OpinionResponse.published — false=draft (hidden from everyone except
-- the author), true=visible per cluster visibility rules.
--
-- Backfill: existing rows are treated as published (they were already visible
-- to the community before this column existed). New rows default to false.

ALTER TABLE "OpinionResponse"
  ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "OpinionResponse"
  ALTER COLUMN "published" SET DEFAULT false;
