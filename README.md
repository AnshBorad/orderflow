# OrderFlow 🛒
Scalable e-commerce orders & payments backend — idempotency, optimistic locking,
transactional outbox, queue workers. Built to prove reliability, not just CRUD.

## Stack
TypeScript · Express · Prisma · PostgreSQL · Redis · BullMQ · Jest

## Run it
docker compose up -d
npm install
cp .env.example .env   # fill secrets
npx prisma migrate dev && npm run db:seed
npm run dev            # http://localhost:3000/health

## API (so far)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/v1/auth/register | — | Create account |
| POST | /api/v1/auth/login | — | Get access + refresh tokens |
| GET | /api/v1/auth/me | Bearer | Current user |
| GET | /api/v1/users | Admin | List users (RBAC) |