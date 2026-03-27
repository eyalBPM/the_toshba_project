# Implement Feature Through All Architecture Layers

You are implementing a feature end-to-end through the layered architecture.
The feature to implement: $ARGUMENTS

## Checklist — follow in order, do NOT skip layers

### 1. Domain Layer (`domain/`)
- [ ] Define or update TypeScript types/interfaces (no Prisma, no framework code)
- [ ] Implement business rules, validations, state transitions
- [ ] Define domain errors
- [ ] Keep pure — no side effects, no DB, no HTTP

### 2. Application Layer (`application/`)
- [ ] Create use-case functions that orchestrate domain logic + repository calls
- [ ] Handle authorization checks (who can do this?)
- [ ] Trigger side effects (notifications, audit logs) after the core action
- [ ] Each use-case should be a single function with clear inputs/outputs

### 3. Database Layer (`db/`)
- [ ] Update Prisma schema if new fields/models are needed (then run `npx prisma migrate dev`)
- [ ] Create or update repository functions (thin wrappers around Prisma)
- [ ] Repositories return domain types, not Prisma types — map if needed

### 4. API Layer (`app/api/`)
- [ ] Create Zod schemas for request validation
- [ ] Create thin route handlers that: validate input → call use-case → return response
- [ ] Use the standard API error envelope for all errors
- [ ] No business logic in route handlers

### 5. UI Layer (`app/` pages + `ui/` components)
- [ ] Create or update page components
- [ ] Create or update reusable UI components in `ui/`
- [ ] Use TanStack Query for data fetching/mutations
- [ ] Use custom hooks to encapsulate complex UI logic

## Rules
- Dependencies flow DOWN only: UI → API → Application → Domain
- Domain NEVER imports from any other layer
- If a file gets large, split it immediately
- Write Zod schemas that match domain types
- Follow existing patterns in the codebase
