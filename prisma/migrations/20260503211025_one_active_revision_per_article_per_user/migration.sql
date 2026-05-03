-- Enforce: at most one active (Draft|Pending) revision per (articleId, createdByUserId).
-- Partial unique index — does not apply when articleId IS NULL (new-article drafts are exempt)
-- and ignores terminal statuses (Approved, Rejected, Obsolete).
CREATE UNIQUE INDEX "ArticleRevision_active_per_user_per_article_unique"
  ON "ArticleRevision" ("articleId", "createdByUserId")
  WHERE "status" IN ('Draft', 'Pending') AND "articleId" IS NOT NULL;
