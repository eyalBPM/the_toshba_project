# The Toshba Project

A community-driven knowledge base where users collaboratively build and validate structured articles through a revision and agreement system.

## Quick Start (Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [PostgreSQL](https://www.postgresql.org/) (v14 or later)
- npm

### Setup

1. Clone the repository and install dependencies:

```bash
git pull
npm install
```

2. Create a `.env` file in the project root with your database connection string:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/toshba?schema=public"
```

3. Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).
