# OrderFlow 🛒

> A scalable e-commerce orders & payments backend built to demonstrate **production-grade reliability engineering** — idempotency, optimistic locking, transactional outbox, queue workers, and observability. Not just CRUD.

![Status](https://img.shields.io/badge/status-in%20development-yellow) ![Tests](https://img.shields.io/badge/tests-passing-brightgreen) ![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)

## 🧠 Why this project exists

Most fresher portfolios show CRUD apps. This project exists to answer the harder interview questions with real, shipped code:

- *"What happens when two users buy the last item at the same moment?"* → **database transactions + optimistic locking**
- *"What if the user double-clicks Pay?"* → **idempotency keys**
- *"What if the DB commits but the message queue fails?"* → **transactional outbox**
- *"How do you log out a stateless JWT?"* → **Redis token blacklist (hashed, TTL-bound)**

Every pattern here was built, tested, and debugged — the commit history tells the story.

## 🧰 Stack

| Layer | Tech |
|---|---|
| Language | TypeScript 5.5 (ESM, NodeNext) |
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| ORM | Prisma 6 |
| Database | PostgreSQL 15 |
| Cache / Broker | Redis 7 (ioredis) |
| Queues | BullMQ (separate worker process) |
| Validation | Zod (inputs + env config) |
| Logging | pino (structured JSON) + pino-pretty (dev) |
| Testing | Jest + Supertest (integration) |
| Containers | Docker + Docker Compose |

## 🚀 Getting Started

```bash
# 1. infrastructure
docker compose up -d          # postgres + redis

# 2. dependencies
npm install

# 3. environment
cp .env.example .env          # then fill: DATABASE_URL, REDIS_URL, JWT secrets

# 4. database
npx prisma migrate dev
npm run db:seed               # admin + 2 customers + 6 products (idempotent)

# 5. run
npm run dev                   # API      → http://localhost:3000
npm run dev:worker            # queue workers (separate process)

# verify
curl http://localhost:3000/health   # {"status":"ok"}          — process alive
curl http://localhost:3000/ready    # {"status":"ready"}       — DB + Redis reachable
```

**Seeded logins** (dev only): `admin@orderflow.dev` · `customer@orderflow.dev` · password: `Password123!`

## 📡 API

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Create account (validated, bcrypt-hashed) |
| POST | `/api/v1/auth/login` | — | Returns access (15m) + refresh (7d) tokens |
| POST | `/api/v1/auth/signOut` | Bearer | Blacklists refresh token in Redis (SHA-256 hash, remaining-TTL) |
| GET | `/api/v1/auth/me` | Bearer | Current user profile |
| GET | `/api/v1/users` | Admin | List users — RBAC protected |
| GET | `/api/v1/products` | — | List products — `?page=&limit=&search=` |
| GET | `/api/v1/products/:id` | — | Product detail (404 if unknown) |
| POST | `/api/v1/products` | Admin | Create product — RBAC protected |

**Error contract:** every response is one of two envelopes —
```jsonc
// success
{ "statusCode": 200, "success": true, "data": { ... }, "message": "..." }
// error
{ "statusCode": 400, "success": false, "message": "...", "errors": { "field": ["..."] } }
```

## 🏗️ Architecture

```
src/
├── modules/                 # feature modules
│   ├── auth/                #   router → controller → service → prisma
│   └── products/
│       ├── router.ts        # HTTP wiring
│       ├── controller.ts    # zod validation + response shaping
│       ├── service.ts       # business logic (no HTTP objects here)
│       └── schemas.ts       # request contracts (zod)
├── middlewares/             # verifyAccessToken, requireAdmin
├── shared/                  # config (zod-validated env), prisma, redis, logger, errorHandler
├── types/                   # Express Request augmentation (req.user)
├── utils/                   # ApiError, ApiResponse, asyncHandler
├── workers/                 # BullMQ workers — separate deployment
└── tests/                   # integration tests (Jest + Supertest)
prisma/
├── schema.prisma            # User, Product, Order, OrderItem, Payment, OutboxEvent, WebhookEvent
└── seed.ts                  # idempotent seed (upserts)
```

**Rules the codebase follows:**

1. **Layered:** routes → controller → service → Prisma. Business logic never touches HTTP objects.
2. **Money is integer paise** (`priceCents`) — never floats.
3. **Every input passes zod** — body, query, *and* params.
4. **Env is validated at startup** — the server refuses to boot with missing/broken config (crash-fast > fail-slow).
5. **Errors flow forward** — controllers never try/catch blindly; `asyncHandler` forwards to one central error handler (zod → 400, ApiError → its status, unknown → logged 500).
6. **API and workers scale independently** — two processes, one codebase.

## 🛡️ Reliability patterns (implemented)

| Pattern | Where | What it prevents |
|---|---|---|
| **JWT + refresh rotation-ready tokens** | `modules/auth` | session theft via long-lived access tokens |
| **Redis token blacklist** (SHA-256 hashed, expiring) | signOut | logged-out tokens remaining usable; Redis leak exposes no valid tokens |
| **RBAC middleware** | `requireAdmin` | customers hitting admin endpoints (403) |
| **Idempotent seeding** | `prisma/seed.ts` | duplicate rows on re-run |
| **Crash-fast env validation** | `shared/config.ts` | 2 AM "undefined secret" debugging |
| **Graceful shutdown** | `src/index.ts` | dropped in-flight requests on SIGTERM |
| **/health + /ready** | `app.ts` | load balancers routing to a dead dependency |

## 🗺️ Roadmap

- [x] Auth — register / login / me / signOut + Redis blacklist
- [x] RBAC — customer vs admin
- [x] Products — paginated list, detail, admin create
- [x] Integration tests — auth + products (Jest + Supertest)
- [ ] **Orders** — interactive transactions + optimistic locking (race-safe stock) + `Idempotency-Key` header
- [ ] **Payments** — Razorpay test mode, webhook signature verification, `WebhookEvent` replay protection
- [ ] **Transactional outbox** → BullMQ workers (emails, async side-effects, retries + DLQ)
- [ ] CI — GitHub Actions (typecheck + lint + test on every push)
- [ ] Observability — k6 load test numbers, Swagger/OpenAPI docs
- [ ] Deployment — Railway, live URL

## 🧪 Tests

```bash
npm test
```

Covers: register (201/409/400), login (200/401 — including *schema-valid but wrong* password), protected routes (200/401/403 RBAC), product CRUD flows (dynamic create-then-fetch, no hardcoded IDs).

## 👤 Author

**Ansh Borad** — [github.com/AnshBorad](https://github.com/AnshBorad)

Backend developer (Node.js · TypeScript · PostgreSQL · Redis · Docker) — currently building the orders module. Open to junior backend roles, remote preferred.
