@AGENTS.md

# THE TOSHBA PROJECT

## 🧠 Role

You are a senior software architect and developer.

Your task is to design and implement a full-stack web application according to this specification.

You must:

1. Analyze requirements
2. Ask clarifying questions when needed
3. Create an implementation plan
4. Define architecture and modules
5. Implement step-by-step

Do NOT jump directly to coding.

---

## 📌 Spec Consistency Rule (MANDATORY)

This `CLAUDE.md` file is the **single source of truth** for the system's rules, behaviors, permissions, entities, and workflows.

**Whenever the user requests a change to any rule of the system** — permissions, role capabilities, entity fields, state machines, validation rules, workflows, UI policies, API contracts, etc. — you MUST update `CLAUDE.md` in the same change to keep the spec consistent with the implementation.

This applies even when the change appears small (e.g., adding/removing a permission, relaxing a constraint, changing a status transition, adding a new admin action). If a rule changes in code, the rule MUST also change in `CLAUDE.md`.

When unsure whether a change qualifies as a "rule change," err on the side of updating the spec.

---

# 🎯 Project Overview

A **community-driven knowledge base** where users collaboratively build structured articles.

Key idea:

- Articles are NOT edited directly
- Users propose **Article Revisions**
- Revisions are accepted via **community agreements**
- Approved revisions become the official article

Goal: Create **high-trust structured knowledge validated by the community**

---

# 🧱 Tech Stack

- Next.js (App Router)
- TypeScript (strict)
- PostgreSQL
- Prisma
- Zod
- Auth.js (Email/Password + Google OAuth)
- TanStack Query
- TipTap (editor)
- Tailwind CSS
- Vitest
- Playwright
- ESLint + Prettier

---

# 🏗 Architecture Rules

The system MUST follow a layered architecture:

### 1. Domain Layer
- Pure business logic
- No framework code
- No Prisma

### 2. Application Layer
- Use-cases
- Orchestration logic

### 3. Database Layer
- Prisma schema
- Repositories

### 4. API Layer
- Validation (Zod)
- Thin controllers

### 5. UI Layer
- Components
- Hooks

### Strict Rules

- Domain must not depend on Next.js
- Domain must not depend on Prisma
- API routes must be thin
- Complex logic must be extracted
- The client must communicate exclusively with the project's internal API. It must not make any direct requests to external services or third-party endpoints.

---

# 📁 Code Quality Rules

- Keep files small
- Avoid large components
- Split into sub-components
- Extract complex logic into separate modules
- Use custom hooks when appropriate
- Prefer composition over large files

If a file becomes large → split it

---

# 🌍 Routing Structure

## Articles

/articles  
/articles/[slug]  
/articles/[slug]/propose  

## Revisions

/articles/[slug]/revisions/[revisionId]  
/articles/[slug]/revisions/[revisionId]/edit  

Fallback (IMPORTANT):
/revisions/[revisionId]

⚠️ NOTE:
- There is NO `/articles/new`
- Creating a revision immediately creates a DB record
- User is redirected to `/revisions/[revisionId]/edit`

## Verification

/verification  
/verification/request  
/verification/requests  

## Users

/users/[userId]

## Notifications

/notifications

## Admin

/admin  
/admin/revisions  
/admin/revisions/[revisionId]  
/admin/minor-changes  
/admin/minor-changes/[id]  
/admin/images  
/admin/images/[id]  
/admin/users  

---

# 🧠 Core Domain

## Article

- id
- title
- slug (auto-generated, unique, required)
- currentRevisionId
- createdAt
- updatedAt — bumped manually on every approved-snapshot swap (new revision approved OR approved minor change). NOT Prisma `@updatedAt` — we want the timestamp to reflect *approved-content* changes, not arbitrary row writes. Powers the "last modified" column on the `/articles` table.
- minSourceIndex — denormalized cache of the lowest `Source.index` across the current snapshot's `sourcesSnapshot` (null when the article has no sources). Maintained alongside `updatedAt` so the `/articles` table can sort by sources without scanning JSON or joining the `Source` table.
- createdByUserId
- sourcesSnapshot (copied from current revision)
- topicsSnapshot (copied from current revision)
- sagesSnapshot (copied from current revision)
- referencesSnapshot (copied from current revision)
- contentLength (copied from current revision)

### Rules:
- An Article is created automatically ONLY when a Revision is approved (no empty articles)
- Slug is generated automatically from the article title using hebrew-transliteration
- If slug conflicts, append incremental suffixes (-2, -3, -4) until unique
- Article MUST always have a slug
- Slug is immutable after creation (for now)
- Snapshot fields are copied from the approved revision for read performance

---

## ArticleRevision

IMPORTANT:
A revision may exist BEFORE an article exists.

Fields:

- id
- articleId (nullable)
- title
- content (JSON)
- status (Draft | Pending | Approved | Rejected)
- createdByUserId
- createdAt
- updatedAt

### Snapshot Fields (CRITICAL):

Each revision must store:

- sourcesSnapshot
- topicsSnapshot
- sagesSnapshot
- referencesSnapshot
- contentLength

If revision is current:
- snapshot fields are copied to the Article (see Article entity above)

### Pre-fill on creation:

- When a revision is created **for an existing article** (articleId provided), the new draft is initialized with the current revision's `title`, `content`, and snapshot fields (`sourcesSnapshot`, `topicsSnapshot`, `sagesSnapshot`, `referencesSnapshot`, `contentLength`). The user then edits these to form their proposed update.
- When a revision is created **for a new article** (no articleId), the user supplies a title and starts with empty content.

---

## Content System

Content is stored as **JSON (TipTap format)**

Supports:

- paragraphs
- inline topics, sages, sources, and references

---

## Abstract Entities

All four taggable entities — **Topics, Sources, Sages, and References** — support **abstract** usage:

- They CAN exist in the revision snapshot without appearing in the article body
- A separate UI button (or, for topics/sages, a "create + add as abstract" action when the queried text is new) adds them to the snapshot abstractly
- Abstract entries are persisted as part of the corresponding `*Snapshot` field; there is no separate "abstract" flag stored in the DB. On load, abstract entries are derived as the set difference `snapshot − inline-occurrences-in-content`
- Each entity has a sidebar surface where the user can see and delete abstract entries (see per-entity sections below)

---

## References (Internal Links)

References are inline links to other articles. No dedicated database table.

Trigger: UI button or Shift+4. A floating panel opens showing a searchable select of existing article titles.

Behavior:
- If text is selected: that text becomes the link label, href = selected article URL
- If no text selected: article title inserted as label at cursor
- Links are always editable (label and target article)
- Stored as part of TipTap content JSON (no separate table)
- On insert: added to referencesSnapshot. On delete: removed from snapshot
- **Abstract support:** separate button adds reference to referencesSnapshot without inserting a link into the body
- **Sidebar panel:** always visible next to editor, shows all current references with delete option. Deleting non-abstract reference also removes its link nodes from body

---

## Topics

DB table with unique entries. Users can select existing or create new topics.

Fields:

- id
- text (unique)

Trigger: UI button or Shift+3. Floating combobox (editable dropdown).

Behavior:
- On submit: inserted at cursor. If text selected, replaced
- On insert: added to topicsSnapshot. On delete: removed from snapshot
- **Abstract support:** separate button adds topic to snapshot without inserting into body
- **Sidebar panel:** always visible next to editor, shows all current topics with delete option. Deleting non-abstract topic also removes it from body

Management:
- Moderation interface for **merging** topics (available to Admin, Senior, Moderator): deleted entry removed from table, all snapshots referencing its ID updated to surviving ID

Rules:
- text must be unique
- no normalization required (case-sensitive, no Hebrew normalization)

---

## Sources

A predefined reference table (loaded via a secret-protected admin endpoint, not user-created).

Fields:

- id
- book
- label
- path (Sefaria API path)
- index (for sorting)

### Loader endpoint

`POST /api/sources` is the **only** write surface for the `Source` table — there is no user-facing UI for creating, editing, or deleting sources.

- **Auth:** `Authorization: Bearer <secret>` header. The secret is read from `process.env.SOURCES_ADMIN_SECRET`. Missing/incorrect token → 401. Missing env var → 500.
- **Body:** `{ sources: [{ id?, book, label, path, index }, ...] }` (Zod-validated). `id` is optional; supplying it allows idempotent re-runs (re-inserting the same `id` is silently skipped via `createMany skipDuplicates: true`). When omitted, a fresh cuid is generated and re-runs will create duplicates — callers that want idempotency MUST supply stable ids.
- **Response:** `{ inserted: number }` with HTTP 201.
- **Cache:** the GET endpoint serves from an in-process memory cache in `lib/sources-cache.ts` (Next.js `unstable_cache` is unusable here — the serialized table exceeds its 2MB per-entry limit). On successful POST, the handler clears the cache so subsequent reads see the new rows. The admin endpoint `POST /api/admin/cache/reset-sources` exposes the same invalidation for manual use.

Trigger: UI button or Shift+2. Searchable select shows sources by label.

Behavior:
- On selection: `[n]` citation marker inserted at cursor (Wikipedia-style). Footer entry appended with number + label
- Numbering reflects document order (top to bottom)
- On hover over citation: fetch source text from **Sefaria API** using source's `path`, display in tooltip
- On insert: added to sourcesSnapshot. On delete: removed from snapshot
- **Abstract support:** separate button adds source to sourcesSnapshot without inserting a citation into the body
- **Sidebar panel:** always visible next to editor, shows all current sources with delete option. Deleting a non-abstract source also removes all of its citation nodes from the body (numbering of the remaining footnotes shifts accordingly). Abstract sources appear only in the sidebar and not in the numbered footer.

### sourcesSnapshot entry shape

Each entry in a revision's / article's `sourcesSnapshot` JSON array has the shape `{ id, label, book, index }`. `book` and `index` are denormalized from the `Source` table at write time so the `/articles` table can sort by `Source.index` and filter by `Source.book` without joining the `Source` table for every query. Pre-2026-05-20 snapshots that predate this denormalization are backfilled by `scripts/backfill-source-snapshots.ts`.

### Books list endpoint

`GET /api/sources/books` returns a deduplicated, sorted array of `Source.book` values. Used by the books filter in the `/articles` table. Served from an in-process memory cache (`lib/books-cache.ts`) and invalidated together with the sources cache (via `POST /api/sources` and `POST /api/admin/cache/reset-sources`).

### Missing Sources

- "Missing Source" button at bottom of sources dropdown
- Inserts numbered citation. Footer entry shows free-form text written by user
- NOT added to sourcesSnapshot
- Recorded in **MissingSources** table with link to article for admin review

### MissingSources Entity

- id
- revisionId
- citationNumber
- text (free-form description)
- createdByUserId
- createdAt

---

## Sages

Represents named authorities.

Fields:

- id
- text (unique)

Trigger: UI button or Shift+5. Floating combobox (editable dropdown).

Behavior:
- Same insert/delete/snapshot behavior as Topics
- **Abstract support:** separate button adds sage to sagesSnapshot without inserting into body (same as Topics)
- **Sidebar panel:** same as Topics

Management:
- Moderation interface for **merging** sages (same roles as Topics: Admin, Senior, Moderator)

Rules:
- text must be unique
- no normalization required (case-sensitive, no Hebrew normalization)

---

## Images

Fields:

- id
- revisionId
- url
- uploadedByUserId
- status (PendingApproval | Approved | Rejected)

### Visibility

The image file itself is served statically from `public/uploads/images/` (no auth). The "only approved images are visible" rule is enforced at **render time** in the TipTap `uploadedImage` node:

- **Revision owner** (`currentUser.id === revision.createdByUserId`) — always sees the image inline in the content, regardless of status.
- **Any other viewer** — sees the image inline only when `status === 'Approved'`. For `PendingApproval`, a placeholder is rendered in place of the `<img>` (text: `"📷 תמונה ממתינה לאישור הניהול"`). For `Rejected`, nothing is rendered at all (no placeholder).

The status is NOT stored inside the TipTap content JSON. The `uploadedImage` node carries `src` and `imageId` only; the renderer looks up the current status from the DB via the `ImageVisibilityProvider` context (`isOwner`, `imageStatuses: Record<imageId, ImageStatus>`), which each page populates server-side.

No per-image status indicator is shown in the body to the owner. The `RevisionImages` sidebar shows per-image status badges and, when at least one image is pending, displays the note `"תמונות שטרם אושרו אינן גלויות למשתמשים אחרים עד לאישור הניהול"`.

---

# ✍️ Editor Features

While writing content, user can insert:

- Sources using Shift+2 or UI button → searchable select, inserts `[n]` citation or abstract
- Topics using Shift+3 or UI button → combobox, inserts inline or abstract
- References using Shift+4 or UI button → searchable select of articles, inserts link or abstract
- Sages using Shift+5 or UI button → combobox, inserts inline or abstract
- Tables using Shift+6 or UI button → inserts a default 3×3 table with a header row at the cursor

System must support:

- autocomplete / search in floating panels
- creation on-the-fly (topics and sages only)
- sidebar panel showing all current topics / sages / sources / references with delete
- Wikipedia-style `[n]` footnotes for sources with footer
- Sefaria API tooltip on source hover
- "Missing Source" for uncatalogued references

## Tables

Tables are stored as standard TipTap table nodes inside the content JSON (no separate DB table, no snapshot tracking).

Behavior:
- Insert via toolbar "טבלה" button or Shift+6. Default size: 3 rows × 3 columns, with a header row.
- Columns are resizable by dragging the column edge.
- When the cursor is inside a table, the toolbar exposes a contextual table sub-toolbar with: add row, add column, delete row, delete column, merge/split cells, delete table.
- Tables render right-to-left (Hebrew); cell text alignment defaults to right.
- The read-only `ContentRenderer` registers the same table extensions so saved tables display identically in article view, opinion view, and any other read-only surface.

---

# 🤝 Agreement System

Fields:

- id
- revisionId
- userId
- createdAt

Rules:

- one per user per revision
- cannot agree with own revision

Policy:

- fixed threshold: 35 agreements
- threshold value must come from a central configuration file (never hardcoded in domain logic)
- no role weighting and no dynamic threshold logic

---

# ✅ Revision Approval

A revision is approved when:

1. It reaches 35 agreements OR
2. Approved manually by Admin or Senior (system override)

Additionally:

- Admin and Senior CAN reject pending revisions; a rejection is final. A Senior rejection must include a note/message.

When approved:

- becomes official article revision
- competing Pending revisions for the same article are rejected (not deleted)

Exception:

- if approval happens through Minor Change flow, competing revisions are NOT rejected

---

# ✏️ Editing Rules

If revision has agreements:

- Any edit will RESET agreements
- User MUST be warned BEFORE editing

Exception:

- system-approved minor change edits preserve agreements

---

# 🔁 Minor Change Flow (REQUIRED)

Allows editing WITHOUT losing agreements.

Flow:

1. User requests a minor change.
   - The revision creator can always request a minor change on their own revision.
   - Admin and Senior can also create a minor change request on any revision (even one they do not own).
2. Admin, Senior, or Moderator reviews and decides whether the change is minor.
3. If approved → agreements preserved.

Rules:

- there is no strict automatic definition of minor change
- only system-approved minor changes preserve agreements
- only one Pending minor change request per revision at a time
- minor change requests can only be created for revisions in `Pending` status
- Admin and Senior may also edit or delete a minor change request on any revision
- on the revision's own MCRs, the revision creator retains full edit/delete rights regardless of who created the request
- when the MCR editor is first opened (no existing pending MCR for the revision), the editor is pre-filled with the parent revision's current `title` and `content`. The user then edits these to form the minor-change proposal.

---

# 💬 Opinion System (UPDATED)

## Clusters (NEW CONCEPT)

Opinion responses belong to a **Cluster**

Clusters are standalone entities (NOT tied to a specific article).

Cluster fields:

- id
- title
- introduction (optional)
- ownerUserId
- visibility:
  - Private
  - Shared (specific users list)
  - Public

Rules:

- All opinion responses must belong to a Cluster
- If a user does not have a Cluster yet, the system automatically creates a default one
- access for Shared visibility is controlled by an explicit list of user IDs
- no role-based sharing (for now)

### Cluster management from the opinion edit page

The opinion edit page (`/articles/[slug]/opinion/[id]/edit`) MUST expose four cluster management capabilities to the response author:

1. **Assign**: change which of the author's clusters the response belongs to.
2. **Add**: create a new cluster (title, optional introduction, visibility). When visibility is `Shared`, the form must also let the author select the specific users that get access.
3. **Edit**: rename / change introduction / change visibility of any cluster the author owns. When visibility is `Shared`, the form must also let the author add or remove users from the access list (the chosen list is sent as `accessUserIds` on `PATCH /api/clusters/:id`, which replaces the previous list).
4. **Delete**: delete a cluster the author owns. Constraints:
   - The author MUST own at least one other cluster — otherwise deletion is refused (`Cannot delete the only cluster`).
   - If the cluster contains any responses, the author MUST pick a target cluster (also owned by them) into which ALL responses in the deleted cluster are moved before the cluster row is deleted. The target cluster id is passed as `?targetClusterId=...` on `DELETE /api/clusters/:id`.
   - The reassign-then-delete flow runs server-side; the `OpinionResponse.cluster` cascade only fires when there are no remaining responses.

The same constraints apply wherever a cluster is deleted (not only this page) and are enforced in the application layer (`deleteOpinionCluster`).

### Reassigning a response to a different cluster

`PATCH /api/opinions/:id` accepts an optional `clusterId` field. When supplied, the server verifies the target cluster is owned by the same user and updates the response's `clusterId`. `content` and `clusterId` are both optional individually, but at least one must be present.

## Responses

- id
- clusterId
- articleId
- savedAtRevisionId
- userId
- published
- content
- createdAt

Rules:

- Opinion responses belong to an **Article**, not to a specific revision. The opinion stays attached to the article as new revisions are approved over time.
- Creating a response requires an existing Article. There is no opinion-on-a-draft flow — if there is no Article yet (the proposed revision has not been approved), there is nothing to opine on.
- `savedAtRevisionId` is a snapshot of `Article.currentRevisionId` at the time of the most recent save. It is **set on create** and **re-stamped on every successful update** (content edit, cluster reassignment, etc.). It is informational only — used by the UI to flag a response as written for a now-superseded revision.
- `published` is a boolean draft gate, default `false` on create. The author flips it to `true` via an explicit publish action and may flip it back to `false` at any time.
- API: `POST /api/opinions` takes `{ articleId, clusterId? }`. The list endpoint `GET /api/articles/:slug/opinions` returns responses for that article (independent of which revision is current). `PATCH /api/opinions/:id` accepts `{ content?, clusterId?, published? }` (at least one required); only the author may PATCH.

Visibility (server-enforced):

- A response with `published = false` is visible **only to its author** (`userId`), regardless of cluster visibility. All other viewers (including cluster owners and Public-cluster visitors) MUST be treated as if the response does not exist (404 / `notFound()`). Applies to every API endpoint and every page that returns or lists responses, including the list endpoint's `where` clause.
- A response with `published = true` follows the existing cluster-visibility rules.

Edit-mode invariant:

- While a response is being edited (i.e., the user is on the editor page `/articles/[slug]/opinion/[id]/edit`), `published` MUST be `false`. The editor uses **auto-save** (debounced ~1.5s after the last keystroke) and every PATCH it issues includes `published: false` alongside the content. The editor also defensively flips `published` to `false` on mount if it arrives published (for direct URL access that bypassed the view-page Edit button), and flushes any pending auto-save on unmount so navigating back to the view page mid-typing does not lose the last edit.
- The view-page **Edit** button: if the response is currently `published` AND the cluster's visibility is NOT `Private`, show a confirmation with the exact text **"כאשר אתה עובר למצב עריכה, הדעה הזו תהיה מוסתרת מהקהילה, עד לאחר שתסיים לערוך, תצא ממצב עריכה, ותאשר פרסום"**. On confirm (or when no confirmation is needed), the client first PATCHes `{ published: false }` and then navigates to the editor page.
- Re-publishing happens only via the view-page **Publish** button (`PATCH { published: true }`). The editor never publishes.

UI policy:

- Owner-only **draft indicator** in the sidebar (`OpinionList` on the article page): each unpublished response card belonging to the current user shows a small yellow badge **"טיוטה — לא פורסם"**. (Non-authors do not see the card at all.)
- Owner-only **draft banner** on the response view page (`/articles/[slug]/opinion/[id]`): when the viewer is the author and the response is unpublished, render a yellow notice above the content explaining that the response is hidden from the community until published.
- "Old revision" indicator (independent of publication): wherever an opinion response is displayed (the sidebar AND the view page), if `response.savedAtRevisionId !== article.currentRevisionId`, render a small muted line beneath the response: **"נכתב עבור מהדורה ישנה"** with the words "מהדורה ישנה" linking to `/revisions/[savedAtRevisionId]`. If `article.currentRevisionId` is unknown to the rendering context (e.g., null), the stale indicator is suppressed.

Users may express agreement with responses.

---

# 🧾 Print Lists (NEW FEATURE)

Users can create collections of articles for printing.

Fields:

- id
- userId
- settings (JSON)
- createdAt

Configurable settings:

- whether to include "explanation" paragraphs
- whether to include clusters (opinions)
- which articles to include
- ordering of articles

---

# 📑 Articles List View (`/articles`)

The `/articles` page renders all approved articles in a table whose state — sort, filters, search — is persistable per-user as a **TableView**.

## Columns

| Column | Source | Sort key | Filter |
|--------|--------|----------|--------|
| כותרת | `Article.title` | alphabetical | — |
| מקורות | snapshot's `sourcesSnapshot` (labels joined) | `Article.minSourceIndex` (lowest `Source.index` in the snapshot) | by `Source.book` (multi-select) |
| נושאים | snapshot's `topicsSnapshot` (texts joined) | `jsonb_array_length(topicsSnapshot)` — count of topics | by topic id (multi-select, search-as-you-type) |
| חכמים | snapshot's `sagesSnapshot` (texts joined) | `jsonb_array_length(sagesSnapshot)` — count of sages | by sage id (multi-select, search-as-you-type) |
| זמן שינוי אחרון | `Article.updatedAt` | by timestamp | — |

## Rules

- All sort / filter operations work against the **current snapshot** (no revision JOIN), except the "include content" search toggle which adds a JOIN against `ArticleRevision.content`.
- Every change to sort, filters, or search resets pagination to the first page.
- Quick search box matches `Article.title` (case-insensitive `ILIKE`). When the "כולל תוכן" checkbox is on, the match also runs against the current revision's `content` JSON serialized as text. The search box acts as an additional filter — combined with the other column filters via `AND`.
- The default direction per column:
  - title — ASC
  - sources (`minSourceIndex`) — ASC, NULLS LAST
  - topics — DESC (most topics first)
  - sages — DESC
  - updatedAt — DESC
- All NULL sort keys are pushed to the end regardless of direction (`NULLS LAST`).

## Books filter UX

- Opens from the מקורות column header. The list of books is fetched once from `GET /api/sources/books` and cached client-side for the page lifecycle.
- Multi-select with checkbox per book + a local search box (substring filter over the list).
- "סמן הכל" selects all visible (post-search-filter) books; "נקה" clears the selection.
- Selecting multiple books filters articles whose `sourcesSnapshot` contains an entry with ANY of the selected `book` values (OR semantics). Implemented server-side via Postgres `@>` containment queries backed by a GIN index on `ArticleSnapshot.sourcesSnapshot`.

## Topics / Sages filter UX

- Same combobox shape as the editor's topic/sage panels: a search input fires `GET /api/topics?search=...` (or `/api/sages?search=...`, limited to 50 matches) on debounce, and the list shows currently-selected chips at the top followed by search results.
- Multi-select; OR semantics across the chosen entries.
- The view config stores both `{ id, text }` per chip — the `text` is a snapshot used for chip display so the popover doesn't need a separate lookup. Server-side filtering ignores `.text` and matches on `.id` only.
- `GET /api/topics` and `GET /api/sages` are **public reads** (no auth) so anonymous visitors can use these filters. The `POST` endpoints remain gated to verified users (existing rule).

## TableView entity

Per-user saved configurations of the `/articles` table.

Fields:

- id
- userSettingsId (FK to `UserSettings`)
- name (user-visible label)
- scope (currently always `"articles"`; reserved for future surfaces like opinion lists / revision lists)
- config (JSON — Zod-validated; see shape below)
- createdAt
- updatedAt (`@updatedAt`)

`config` shape (validated by `articlesViewConfigSchema` in `domain/articles-list/view-config.ts`):

```jsonc
{
  "sort":     { "col": "updatedAt" | "title" | "sources" | "topics" | "sages",
                "dir": "asc" | "desc" },
  "filters":  { "books":  ["string", ...],
                "topics": [{ "id": "string", "text": "string" }, ...],
                "sages":  [{ "id": "string", "text": "string" }, ...] },
  "search":   { "text": "string", "includeContent": false }
}
```

Mutations:

- `POST /api/user/table-views` — `{ name, config }` → creates a new view in scope `articles`. Sets the new view as the active view if the user has none.
- `PATCH /api/user/table-views/:id` — `{ name?, config? }` (at least one). Only the view's owner can mutate.
- `DELETE /api/user/table-views/:id` — owner only. If the view was the active one, `UserSettings.activeTableViewId` is cleared via the FK `ON DELETE SET NULL`.
- `POST /api/user/settings/active-view` — `{ tableViewId: string | null }`. Switches the active view (or back to default with `null`).

## Default view (UI-only)

There is a synthetic "ברירת מחדל" view shown to every user (including unauthenticated). It is **not** stored in the DB — it is the sentinel for `UserSettings.activeTableViewId === null`.

- Default config: `{ sort: { col: 'updatedAt', dir: 'desc' }, filters: { books: [], topics: [], sages: [] }, search: { text: '', includeContent: false } }`.
- Anonymous users always sit on the default view and cannot save.
- Logged-in users on the default view who change sort / filter / search are tracked as **dirty**; a "💾 שמור כמבט חדש" button appears that opens a dialog to name and persist the current config as a new TableView (which then becomes active). The dirty state is local to the session — refreshing the page returns to clean default.

## Persistence behavior

- When a saved view is active, every sort/filter/search mutation **auto-saves** to that view via debounced `PATCH /api/user/table-views/:id` (~500ms idle).
- When the default view is active, mutations stay client-side until the user explicitly saves.

## UserSettings entity

1:1 with User. Lazy-created on first access via `GET /api/user/settings/articles-view`.

Fields:

- id
- userId (unique FK to `User`, `onDelete: Cascade`)
- activeTableViewId — nullable FK to `TableView` (`onDelete: SET NULL`). `null` ⇒ default view.

## API contract for `/api/articles`

`GET /api/articles` accepts:

- Legacy params (unchanged): `cursor`, `limit`, `search`. When **none** of the new params below are present, the endpoint preserves its legacy behavior (cursor-by-id pagination, ordered by `createdAt DESC`) for the article autocomplete consumers.
- Table-mode params (any of these triggers the new code path):
  - `sort` ∈ {title, sources, topics, sages, updatedAt}
  - `dir` ∈ {asc, desc}
  - `books`, `topicIds`, `sageIds` — comma-separated lists
  - `searchInContent` ∈ {`"1"`, `"true"`}
- In table mode, `cursor` is interpreted as an integer offset (offset-pagination). The response includes `{ items, nextCursor, total }`; `nextCursor` is the next offset as a string or `null` when the page is the last.

---

# 👤 Users

States:

- PendingVerification
- VerifiedUser

Roles (hierarchical — each higher role inherits all permissions of the roles below it):

- Admin (highest)
- Senior
- Moderator
- User (default)

### Role Assignment:
- First Admin is manually assigned via direct DB update
- Only Admin can assign or change user roles (grant, promote, or demote any role — including other Admins)
- No other role has role-management capability

---

# 🔐 Verification System

## VerificationRequest

- id
- requestingUserId
- requestedVerifierId
- message
- status
- createdAt

## UserVerification

- id
- verifiedUserId
- verifiedByUserId
- createdAt

Rules:

- only verified users may verify through the request flow
- user becomes verified after approval
- all actions must be recorded
- Admin and Senior may also verify a Pending user directly from the admin users page, without an existing VerificationRequest. When done this way:
  - the acting Admin/Senior is recorded as `verifiedByUserId` on the new UserVerification
  - if the target user already has a Pending VerificationRequest, it is auto-closed as `Approved` so no dangling request remains
  - the action is recorded in the audit log as `VERIFICATION_GRANTED_BY_ADMIN`
  - UI policy on the requester's own profile (`/users/[userId]`): a request whose status is `Approved` but whose `requestedVerifierId` does NOT match the user's `UserVerification.verifiedByUserId` MUST be displayed as "אומת על ידי המערכת" — not as "אושר", to avoid implying the requested verifier approved it
- Admin and Senior may also revoke verification of a verified user directly from the admin users page. Constraints:
  - only verified users whose role is `User` may have their verification revoked — Moderators, Seniors, and Admins cannot have their verification revoked (their role must be demoted to `User` first)
  - the user's status flips back to `PendingVerification`
  - historical UserVerification records are preserved (not deleted) for audit purposes
  - the action is recorded in the audit log as `VERIFICATION_REVOKED_BY_ADMIN`
  - UI policy on the user's profile (`/users/[userId]`): historical UserVerification records MUST NOT be displayed when the user's current status is `PendingVerification` (e.g., after a revocation). The "אומת על ידי X" line and any derived UI cues (such as the admin-closed request label) are gated on the user's current status, not on the existence of UserVerification records. Likewise, in the "בקשות אימות שלי" list on the user's own profile, requests with status `Approved` MUST be hidden when the user's current status is `PendingVerification` — only `Pending` and `Rejected` requests are shown in that case (since a previously-approved verification has been undone).
- each verified user record must store verifiedByUserId

---

# 🔒 Permissions

## Visibility-based

Draft revisions are PRIVATE to their owner:

- A revision in `Draft` status is visible ONLY to its `createdByUserId` (the owner)
- Any other user — including Admin, Senior, Moderator, and unauthenticated visitors — MUST be treated as if the draft does not exist (404 / `notFound()`)
- Applies to all surfaces: every page that renders a revision, every API endpoint that returns one, and any list that would otherwise expose drafts of others
- `Pending`, `Approved`, `Rejected`, and `Obsolete` revisions are public (no owner gate at the view layer; role/status gates still apply to actions)

## Status-based

Only verified users may:

- create revisions
- agree
- write responses

Pending users:

- read-only
- request verification

## Role-based (hierarchical: Admin > Senior > Moderator > User)

Each higher role inherits all permissions of the roles below it.

### User (default)
- no elevated permissions

### Moderator
- approve / reject images
- approve / reject minor change requests
- merge Topics and Sages

### Senior (inherits Moderator)
- approve pending revisions (system override)
- reject pending revisions
  - a rejection by a Senior is final
  - rejection must include a note/message
  - revision author must be notified
- create / edit / delete minor change requests on any revision
- directly verify a Pending user from the admin users page, without requiring an existing VerificationRequest
- revoke verification of a verified user (only allowed when the target's role is `User`)

### Admin (inherits Senior)
- manage user roles (grant, change, demote — including assigning other Admins)

---

# 🔄 State Machines

## Revision Status

- Draft → Pending
- Pending → Draft (user can retract to draft)
- Pending → Approved
- Pending → Rejected
- Approved is immutable
- Rejected is immutable

## Draft Rules

- Users can have multiple drafts across different articles, but at most one active revision per article (see "One Active Revision Per Article" below)
- Drafts can be deleted

---

## One Active Revision Per Article (Hard Constraint)

A user MUST NOT have more than one **active** revision for the same article.

- "Active" = status is `Draft` or `Pending`. `Approved`, `Rejected`, and `Obsolete` are terminal/historical and do NOT count.
- Applies per `(articleId, createdByUserId)`. New-article drafts (`articleId IS NULL`) are exempt — a user may have many such drafts in parallel.
- Enforced at the database layer via a partial unique index on `(articleId, createdByUserId)` filtered to active statuses, AND at the application layer in `createRevision`.

### Behavior when a user already has an active revision for an article:
- API: creating another active revision returns HTTP 409 `CONFLICT` with the existing revision's id, so clients can redirect.
- UI: in place of the "הצע עדכון" button, the user sees a "צפייה בהצעה הקיימת שלך" link that goes to the existing draft/pending revision.

## Verification Request Status

- Pending → Approved
- Pending → Rejected

---

# ⚔️ Concurrency Rules

- first successful action wins
- concurrent conflicting actions: one succeeds, the other returns an error

---

# 🧾 Audit Logging

The system MUST write audit logs for:

- approvals
- rejections
- edits
- verification actions

## AuditLog Entity

- id
- action
- entityType
- entityId
- userId
- metadata (JSON)
- createdAt

---

# 🔔 Notification System

## Notification Entity

- id
- userId (recipient)
- type
- entityType
- entityId
- message
- read (boolean)
- createdAt

## Triggers

Notifications are created for:

- revision approval
- revision rejection (including Senior rejection with note)
- new agreements on user's revision
- verification request status changes
- role changes (any promotion or demotion)
- being added to a Shared opinion `Cluster`'s access list (one notification per newly-added user, type `CLUSTER_SHARED`, `entityType: 'OpinionCluster'`). Removing a user from the access list does NOT generate a notification. Existing users in the list when the access list is re-saved are not re-notified.
- any other relevant user-impacting event

---

# 🖼 Image Storage

- Images are stored locally on the filesystem (current phase) under `public/uploads/images/` and are served statically by Next.js with no auth gate
- URL field stores the relative path to the file
- Approval-based visibility is enforced at render time only — see "Images → Visibility" above for the rule

---

# 📄 Pagination & Search

## Pagination

- Use cursor-based pagination (preferred) or limit+offset
- When filters/sort change → reset to page 1
- UI will use infinite scrolling (not numbered pages)

## Search

- Full search and filtering must be supported across all relevant fields
- Articles searchable by title and content
- Users searchable by name/email

---

# 🌐 i18n and Layout

- Hebrew-only system (current phase)
- global layout must use dir="rtl"

---

# ❗ API Error Contract

- all API routes must return a standard, consistent error format
- validation and domain errors must follow the same contract envelope

---

# 🚧 Security Scope (Current Phase)

- rate limiting, abuse prevention, and moderation are deferred to a later phase

---

# ⚡ Non-Functional Requirements

- performance is important
- prefer SSR where applicable
- expected scale target: up to ~100,000 users

---

# 🧪 Testing Rules

Use Vitest.

Must test:

- revision approval logic
- agreement constraints
- editing behavior
- minor change flow
- verification logic

Rules:

- test behavior, not implementation
- domain tests must run without server

---

# 🗄 Database Rules

- Prisma is the source of truth
- Use migrations only
- Avoid destructive changes
- Prefer additive updates

---

# 🧠 Development Process

You MUST:

1. Analyze requirements
2. Ask questions if needed
3. Propose architecture
4. Propose DB schema
5. Propose task breakdown
6. Then implement step-by-step

Do NOT:

- implement everything at once
- skip planning
- assume missing requirements

---

# ⚠️ Critical Constraints

- Use revisionId as source of truth (NOT slug)
- Slug is for routing only
- Must support revision without article
- Keep system modular and scalable

---

# ❓ Questions

If anything is unclear:

ASK before implementing.

Do not guess.

---

# 🎯 Goal

Build a scalable, maintainable system with:

- clean architecture
- strong domain logic
- high code quality
- clear workflows