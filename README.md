# PredictPoint

A play-money prediction market built with Next.js 14, Prisma 7, and SQLite/Turso (libSQL).

Users bet points on market outcomes; an admin resolves each market and winners split the
pool in proportion to their stake (parimutuel). If nobody backed the winning outcome, every
bet is refunded.

## Setup

```bash
npm install
cp .env.example .env     # set DATABASE_URL, TURSO_AUTH_TOKEN (Turso only), JWT_SECRET
npm run db:migrate
npm run seed             # admin/admin123, demo/demo123 (1000 pts), one sample market
npm run dev
```

For local SQLite, set `DATABASE_URL="file:./dev.db"` (this is also the default).
`JWT_SECRET` is required in production.

## Key code

- `prisma/schema.prisma` — User, Market, Outcome, Bet, Transaction (points ledger)
- `lib/odds.ts` — implied probability and payout math
- `app/api/markets/[id]/bets` — placing a bet
- `app/api/markets/[id]/resolve` — settling a market and paying out
- `app/api/admin/users/[id]/balance` — granting points (new users start with 0)
- `middleware.ts` — login / admin route protection
