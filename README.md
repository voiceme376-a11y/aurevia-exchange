# Aurevia Exchange

Aurevia Exchange is a full-stack internal trading-platform implementation built with Next.js 14, TypeScript, PostgreSQL, Prisma, NextAuth, Socket.io, Zustand, Tailwind CSS and Recharts.

## What is implemented

### User application
- Landing page, registration and credential login
- JWT sessions with USER/ADMIN role enforcement
- KYC submission and review status
- Profile and account settings
- 2FA security flag
- Live dashboard with cash equity and open positions
- Realtime market ticker
- Trading terminal with Market, Limit and Stop orders
- Simulated order book and realtime candles/price chart
- Open-order cancellation
- One-click position close
- Unrealized P&L display
- Wallet balance from the ledger
- Deposit and withdrawal requests
- Funding history

### Administration
- Role-protected admin area
- User list and freeze/unfreeze
- Role changes
- KYC approval/rejection
- Deposit/withdrawal approval queue
- Force-close open positions
- Instrument enable/disable and configuration API
- System settings
- Audit log
- Realtime operational statistics

### Financial engine
- PostgreSQL persistence
- Prisma transactions
- Double-entry ledger
- Ledger balance derived from entries
- Serializable transactions for financial mutations
- Atomic funding approval
- Atomic trade reservation
- Margin release and realized P&L settlement
- Trading fees
- Insufficient-funds protection
- No direct mutable customer cash balance

### Market engine
- Internal simulated instruments
- Random-walk price engine
- One-minute candles
- Automatic Limit/Stop order processing
- Socket.io market:update events
- Socket.io trade:update events
- REST market, candle and order-book endpoints

## Important scope boundary

The platform's funding and market environment is intentionally internal simulation. `BANK_SIM`, `CRYPTO_SIM`, and `INTERNAL_TRANSFER` are not bank, card, blockchain, custody, or exchange integrations. Connecting real customer money or external execution requires regulated providers, KYC/AML/sanctions controls, reconciliation, custody, licensing, security review and jurisdiction-specific compliance.

The 2FA control currently stores the account-security flag. A real deployment must connect a TOTP/WebAuthn challenge and recovery process before treating it as actual multi-factor authentication.

## Requirements

- Node.js 20+
- Docker Desktop or PostgreSQL 15+
- npm

## Environment

Copy `.env.example` to `.env`.

Required values:

```env
DATABASE_URL=postgresql://aurevia:aurevia@localhost:5432/aurevia
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@aurevia.exchange
ADMIN_PASSWORD=ChangeMe_123!
MARKET_TICK_MS=2500
PORT=3000
```

For a real deployment, use a unique high-entropy `NEXTAUTH_SECRET`, a strong administrator password and managed secret storage.

## Local setup

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npx prisma generate
npm run db:push
npm run db:seed
npm run typecheck
npm test
npm run build
npm run dev
```

Open `http://localhost:3000`.

The application server owns the HTTP server and Socket.io endpoint, so use `npm run dev` rather than `next dev` when realtime functionality is required.

## Default administrator

```text
Email: admin@aurevia.exchange
Password: ChangeMe_123!
```

These values come from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Change them before deployment.

## Docker

```bash
docker compose up --build
```

The included compose file starts PostgreSQL. The application container uses the same `DATABASE_URL` and listens on port 3000.

## Test workflow

### 1. Health

Open:

```text
GET /api/health
```

Expected response includes `ok: true` and `database: "ok"`.

### 2. Admin login

Open `/login` and use the configured administrator credentials. `/admin` must be accessible only to an ADMIN JWT.

### 3. User registration

Create a normal account from `/register`, sign in, and confirm `/dashboard`, `/trade`, `/wallet`, `/kyc` and `/settings` are protected routes.

### 4. KYC

Submit the KYC form. Admin can approve or reject the account from `/admin`.

### 5. Funding

Create a deposit request in `/wallet`. Admin approves it. The customer's USD ledger balance increases through a double-entry transaction.

Create a withdrawal request. Approval checks available ledger balance inside a serializable database transaction before posting the debit.

### 6. Trading

After funding a user account:

1. Open `/trade`.
2. Select an instrument.
3. Place a Market order.
4. Confirm an execution and position appear.
5. Watch the price update through Socket.io.
6. Confirm unrealized P&L changes.
7. Close the position.
8. Confirm margin plus realized P&L is returned to the user ledger.

For Limit and Stop orders, place an order outside the current trigger price, then wait for the market simulator to reach its trigger. The server processes eligible open orders on market ticks.

### 7. Ledger invariant

Every posted monetary transaction contains exactly one debit and one credit for the same amount. The test suite also covers positive monetary quantities.

### 8. Admin controls

From `/admin`, test:

- Freeze/unfreeze a user
- Approve/reject KYC
- Change USER/ADMIN role
- Approve/reject funding
- Force-close positions
- Enable/disable instruments
- Change system settings
- Inspect audit logs

### 9. API checks

Useful endpoints:

```text
GET  /api/health
GET  /api/market
GET  /api/candles?instrumentId=<id>&limit=100
GET  /api/orderbook?instrumentId=<id>
GET  /api/orders
POST /api/orders
DELETE /api/orders
GET  /api/positions
POST /api/positions
GET  /api/wallet
POST /api/wallet
GET  /api/kyc
POST /api/kyc
```

## Production hardening checklist

Before real-money use, add and independently verify:

- Managed PostgreSQL with backups and point-in-time recovery
- Distributed rate limiting rather than process-memory rate limiting
- TOTP/WebAuthn 2FA with recovery codes
- Email/phone verification
- KYC document storage and verification provider
- AML and sanctions screening
- Real payment/custody integrations
- External market-data and execution integrations
- Reconciliation jobs
- Idempotency keys for every financial POST operation
- CSRF/origin controls appropriate to the deployment topology
- Structured security logging and alerting
- Secrets manager
- WAF/DDoS controls
- Database connection pooling
- Penetration testing
- Dependency/SBOM scanning
- Disaster recovery testing
- Regulatory review for every operating jurisdiction

## Project structure

```text
app/
  api/                 REST API routes
  admin/               admin control center
  dashboard/           portfolio dashboard
  trade/               trading terminal
  wallet/              funding interface
  kyc/                 KYC interface
  settings/            account settings
  login/               authentication UI
  register/            onboarding UI
components/            reusable React components
lib/                    authentication, ledger, market and order engines
prisma/                 schema and seed
server.ts               Next.js + Socket.io application server
tests/                  automated tests
Dockerfile              application image
docker-compose.yml      PostgreSQL + application orchestration
```

## Final implemented application surface

The current source includes:

- Dedicated `/admin/login` administrator entry point with role enforcement.
- Realtime Socket.io market ticks and execution broadcasts.
- Synthetic depth/order-book endpoint at `/api/orderbook`.
- Historical candle endpoint at `/api/candles`.
- User ledger transaction endpoint at `/api/ledger`.
- Full order retrieval and cancellation API.
- Market, limit and stop order triggering.
- Serializable order execution and leverage-aware margin reservation.
- Trading-fee ledger postings.
- Open-position unrealized P&L on the dashboard and trading terminal.
- Pending-withdrawal balance reservation checks.
- Admin instrument creation, enable/disable, price and leverage editing.
- Admin self-protection against freezing or demoting the currently logged-in administrator.
- Global loading, error and not-found UI states.
- Health endpoint suitable for container/load-balancer checks.

## Verification evidence

A repository-wide TypeScript/TSX parser scan was run after the final source edits and returned `parse_errors=0`.

A full dependency installation and therefore a complete `typecheck`, Prisma generation, Next production build and browser E2E run could not be completed in the execution environment because `npm install --no-audit --no-fund` timed out. Those commands remain the authoritative final verification commands on a machine with normal npm registry access.

Run:

```bash
npm install
npx prisma generate
npm run db:push
npm run db:seed
npm run typecheck
npm test
npm run build
npm run dev
```

This remains a simulated/internal trading and accounting platform. It is not, by itself, a licensed real-money brokerage, payment processor, custodian, KYC provider, or external execution venue.
