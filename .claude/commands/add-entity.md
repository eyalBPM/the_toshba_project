# Add New Domain Entity

You are adding a new domain entity to the system.
The entity to add: $ARGUMENTS

## Steps — follow in order

### 1. Domain Types (`domain/<entity>/`)
- [ ] Create `types.ts` — TypeScript interfaces for the entity (no Prisma imports)
- [ ] Create `errors.ts` — Domain-specific error classes if needed
- [ ] Create `rules.ts` — Business rules, validations, constants (if applicable)
- [ ] If the entity has a state machine, create `state-machine.ts`

### 2. Prisma Model (`prisma/schema.prisma`)
- [ ] Add the Prisma model with all fields, relations, and indexes
- [ ] Run `npx prisma migrate dev --name add-<entity-name>`
- [ ] Verify the migration looks correct

### 3. Repository (`db/<entity>.repository.ts`)
- [ ] Create repository with CRUD operations
- [ ] Map Prisma types to domain types
- [ ] Add any specialized queries (e.g., findBySlug, findByStatus)

### 4. Zod Schemas (`lib/validations/<entity>.ts`)
- [ ] Create Zod schemas for API input validation
- [ ] Create schemas for create, update, and query params
- [ ] Schemas should match domain types

## Rules
- Domain types must NOT use Prisma-generated types
- Repository is the ONLY place that imports from Prisma
- Entity IDs use the same type as defined in Prisma (typically `string` / UUID)
- Keep each file focused — if rules are complex, give them their own file
- Follow existing patterns in the codebase
