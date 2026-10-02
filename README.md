# Organika — Organic Grocery E-commerce (Bangladesh)

Single-vendor organic shop (Ghorer Bazar style) — own brand, content, imagery.

## Structure (no `apps/` folder)

```
Organika/
├── frontend/   # Next.js 16 storefront + admin (was `apps/web` + `apps/admin`)
├── backend/    # NestJS 12 REST API + worker (was `apps/api`)
├── packages/
│   ├── schemas/  # shared Zod 4 schemas (single source of truth FE/BE)
│   ├── utils/    # money (paisa), phone, slug helpers
│   └── config/   # shared tsconfig / eslint
├── docker/       # Caddyfile, postgres init
├── docker-compose.yml
├── docker-compose.prod.yml
└── turbo.json
```

Frontend = storefront (`/`, `/collections`, `/products`, `/checkout`…)
+ admin dashboard under `/admin` (same Next.js app, role-guarded).
Backend = NestJS API `:4000` + BullMQ worker (same image, different command).

## Quick start (no Docker needed for dev)

```bash
# 1. install
pnpm install

# 2. env
cp .env.example .env

# 3a. run backend (needs DATABASE_URL + REDIS_URL in .env)
pnpm --filter backend start:dev

# 3b. run frontend (needs NEXT_PUBLIC_API_URL in .env)
pnpm --filter frontend dev
```

## Quick start (Docker — matches blueprint)

```bash
docker compose up -d
# frontend :3000, backend :4000, postgres :5432, redis :6379
```

## Conventions (from blueprint)

- Money in **paisa Int** (2500 BDT → 250000). No floats. Format with `Intl.NumberFormat('en-BD')`.
- Phone = identity: `/^01[3-9]\d{8}$/`, OTP 6-digit, Redis 5-min TTL.
- Order snapshots: OrderItem copies name/price; Order copies address.
- Never trust browser redirect for payments — only server-to-server IPN marks PAID.
