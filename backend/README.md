Harmonia backend (Phase One foundation)

This folder contains the minimal backend foundation used for Phase One: NestJS TypeScript project, Prisma configuration (no domain models yet), health endpoint, structured logging, env validation, and tests.

Local setup

1. Copy the example env file and customize:

   cp .env.example .env
   # edit .env and set DATABASE_URL for your local Postgres if needed

2. Install dependencies (from repository root or inside backend/):

   cd backend
   npm install

3. Run in development mode:

   npm run start:dev

4. Build and run:

   npm run build
   npm start

Tests

- Run the test suite:

  npm test

Notes

- This is a foundation only; domain models, auth, file storage, AI, and migration endpoints are not implemented yet.
- Do NOT commit real secrets. Use environment variables and secret stores for production.
