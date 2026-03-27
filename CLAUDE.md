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

---

## Content System

Content is stored as **JSON (TipTap format)**

Supports:

- paragraphs
- inline topics, sages, sources, and references

---

## Abstract Entities

Topics and Sources support **abstract** usage:

- They CAN exist in the revision snapshot without appearing in the article body
- A separate UI button adds them to the snapshot abstractly
- Sages and References do NOT support abstract usage

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
- Admin interface for **merging** topics: deleted entry removed from table, all snapshots referencing its ID updated to surviving ID

Rules:
- text must be unique
- no normalization required (case-sensitive, no Hebrew normalization)

---

## Sources

A predefined reference table (loaded via script, not user-created).

Fields:

- id
- book
- label
- path (Sefaria API path)
- index (for sorting)

Trigger: UI button or Shift+2. Searchable select shows sources by label.

Behavior:
- On selection: `[n]` citation marker inserted at cursor (Wikipedia-style). Footer entry appended with number + label
- Numbering reflects document order (top to bottom)
- On hover over citation: fetch source text from **Sefaria API** using source's `path`, display in tooltip
- On insert: added to sourcesSnapshot. On delete: removed from snapshot
- **Abstract support:** separate button adds source to sourcesSnapshot without inserting a citation into the body

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
- No abstract support
- **Sidebar panel:** same as Topics

Management:
- Admin interface for **merging** sages (same as Topics)

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

Only approved images are visible.

---

# ✍️ Editor Features

While writing content, user can insert:

- Sources using Shift+2 or UI button → searchable select, inserts `[n]` citation or abstract
- Topics using Shift+3 or UI button → combobox, inserts inline or abstract
- References using Shift+4 or UI button → searchable select of articles, inserts link
- Sages using Shift+5 or UI button → combobox, inserts inline

System must support:

- autocomplete / search in floating panels
- creation on-the-fly (topics and sages only)
- sidebar panel showing all current topics/sages with delete
- Wikipedia-style `[n]` footnotes for sources with footer
- Sefaria API tooltip on source hover
- "Missing Source" for uncatalogued references

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
2. Approved by Admin (system override)

Additionally:

- Senior users CAN reject pending revisions

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

1. user requests minor change
2. Admin reviews and decides whether the change is minor
3. if approved → agreements preserved

Rules:

- there is no strict automatic definition of minor change
- only system-approved minor changes preserve agreements

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

## Responses

- id
- clusterId
- revisionId
- userId
- content
- createdAt

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

# 👤 Users

States:

- PendingVerification
- VerifiedUser

Roles:

- Admin
- Moderator
- Senior (NEW)

### Senior Role Assignment:
- First Senior user is manually assigned via direct DB update
- After that, Senior users can grant the Senior role to other users

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

- only verified users may verify
- user becomes verified after approval
- all actions must be recorded
- no admin shortcut flow (verification is always user-based)
- each verified user record must store verifiedByUserId

---

# 🔒 Permissions

Only verified users may:

- create revisions
- agree
- write responses

Pending users:

- read-only
- request verification

Admins:

- approve revisions
- approve images
- approve minor changes

Senior users:

- reject pending revisions
- a single Senior rejection is final
- rejection must include a note/message
- revision author must be notified

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

- Users can have multiple drafts
- Drafts can be deleted

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
- role changes (e.g., granted Senior)
- any other relevant user-impacting event

---

# 🖼 Image Storage

- Images are stored locally on the filesystem (current phase)
- URL field stores the relative path to the file

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