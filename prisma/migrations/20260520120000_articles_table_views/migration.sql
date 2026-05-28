-- Articles list view: denormalized sort fields on Article, per-user
-- saved table views, and GIN indexes for snapshot containment filtering.

-- ── Article: columns the /articles table sorts on ─────────────────────
-- Bumped manually on every approved-snapshot swap (new revision approved
-- OR approved minor change). NOT Prisma `@updatedAt` — we want the timestamp
-- to reflect approved-content changes, not arbitrary row writes.
ALTER TABLE "Article"
  ADD COLUMN "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT now(),
  ADD COLUMN "minSourceIndex" INTEGER;

CREATE INDEX "Article_updatedAt_idx"      ON "Article" ("updatedAt");
CREATE INDEX "Article_minSourceIndex_idx" ON "Article" ("minSourceIndex");

-- ── GIN indexes on snapshot JSON for cheap @> containment queries ─────
-- Prisma can't express GIN expressions declaratively, so they live in raw
-- SQL only. NOTE: future `prisma migrate dev` runs will diff against
-- schema.prisma and offer to drop these — say no.
CREATE INDEX "ArticleSnapshot_sourcesSnapshot_gin"
  ON "ArticleSnapshot" USING GIN ("sourcesSnapshot" jsonb_path_ops);

CREATE INDEX "ArticleSnapshot_topicsSnapshot_gin"
  ON "ArticleSnapshot" USING GIN ("topicsSnapshot"  jsonb_path_ops);

CREATE INDEX "ArticleSnapshot_sagesSnapshot_gin"
  ON "ArticleSnapshot" USING GIN ("sagesSnapshot"   jsonb_path_ops);

-- ── UserSettings: 1:1 per user, lazy-created on first need ────────────
CREATE TABLE "UserSettings" (
  "id"                TEXT NOT NULL,
  "userId"            TEXT NOT NULL,
  "activeTableViewId" TEXT,
  CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings" ("userId");

ALTER TABLE "UserSettings"
  ADD CONSTRAINT "UserSettings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── TableView: many-per-user, scoped to a feature (currently "articles")
CREATE TABLE "TableView" (
  "id"             TEXT NOT NULL,
  "userSettingsId" TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "scope"          TEXT NOT NULL,
  "config"         JSONB NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TableView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TableView_userSettingsId_scope_idx"
  ON "TableView" ("userSettingsId", "scope");

ALTER TABLE "TableView"
  ADD CONSTRAINT "TableView_userSettingsId_fkey"
    FOREIGN KEY ("userSettingsId") REFERENCES "UserSettings" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Back-reference: UserSettings → active TableView (FK created after TableView
-- exists). ON DELETE SET NULL so deleting a view clears the pointer.
ALTER TABLE "UserSettings"
  ADD CONSTRAINT "UserSettings_activeTableViewId_fkey"
    FOREIGN KEY ("activeTableViewId") REFERENCES "TableView" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
