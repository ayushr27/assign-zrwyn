# Finance Data Processing and Access Control Backend

Backend assignment implementation for a finance dashboard system. The API supports:

- JWT-based authentication with seeded demo users
- Role-based access control for `viewer`, `analyst`, and `admin`
- Financial record CRUD with filtering, sorting, pagination, soft delete, and restore
- Admin-safe user lifecycle management with archive and restore flows
- Dashboard summary and insight APIs for totals, category breakdowns, trends, recent activity, and deeper financial metrics
- Dual persistence setup: local SQLite for development/tests and PostgreSQL for deployment
- Validation, structured error responses, rate limiting, and Swagger UI docs
- Render blueprint included for one-click web service + Postgres provisioning

## Stack

- Node.js
- Express
- SQLite (`better-sqlite3`) for local development/tests
- PostgreSQL (`pg`) for deployment
- Joi
- JWT (`jsonwebtoken`)
- Jest + Supertest

## Role Model

- `viewer`
  - Can log in
  - Can read dashboard summary APIs
  - Cannot access deeper analyst insights
  - Cannot access raw finance records
- `analyst`
  - Can log in
  - Can read dashboard summary APIs
  - Can access insight-level analytics
  - Can read finance records
  - Cannot create, update, or delete records
- `admin`
  - Full access to dashboard APIs
  - Full finance record management
  - Full user management

## Requirement Mapping

1. User and Role Management
   - User creation, listing, lookup, updates, archive, and restore are implemented under `/api/users`.
   - Roles are enforced as `viewer`, `analyst`, and `admin`.
   - User status is supported as `active` or `inactive`.
   - Archived users are excluded from standard user listings and blocked from login.
   - Inactive users are blocked from logging in.

2. Financial Records Management
   - Create, read, update, delete, and restore flows are implemented under `/api/records`.
   - Delete is implemented as soft delete.
   - Filtering supports `type`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `search`, `sortBy`, `sortOrder`, `page`, and `pageSize`.

3. Dashboard Summary APIs
   - `/api/dashboard/summary` returns total income, total expenses, net balance, category totals, recent activity, and monthly or weekly trends.
   - `/api/dashboard/insights` returns higher-level metrics such as savings rate, expense ratio, largest transactions, top categories, and best/worst periods.

4. Access Control Logic
   - Middleware enforces permissions by role before route handlers execute.
   - `viewer` can access dashboard summaries only.
   - `analyst` can read summaries, insights, and records.
   - `admin` can manage users and records.

5. Validation and Error Handling
   - Joi validates request bodies, params, and query strings.
   - Invalid calendar dates and invalid date ranges are rejected.
   - Errors return consistent JSON payloads with appropriate status codes.

6. Data Persistence
   - SQLite persistence is file-backed in development and in-memory during tests.
   - PostgreSQL is supported for deployment and is the recommended production target.

## Assumptions

- Amounts are stored internally as integer cents to avoid floating-point issues.
- “Deleting” a finance record is implemented as soft delete via `deleted_at`.
- Authentication is implemented because access control is clearer to evaluate with real tokens.
- The viewer role is intentionally restricted to dashboard-level data only, based on the prompt’s example role definition.
- Insight-level analytics are intentionally separated from the general summary API so the `analyst` role has a meaningful capability beyond simple read access.
- SQLite is used for fast local setup and deterministic tests.
- PostgreSQL is used for cloud deployment because it is a better fit than SQLite on platforms like Render.
- Node.js 20+ is recommended locally, and the included Render configuration pins Node `22.22.0`.

## Seeded Demo Credentials

The database is automatically initialized with these users:

- `admin@finance.local` / `Admin123!`
- `analyst@finance.local` / `Analyst123!`
- `viewer@finance.local` / `Viewer123!`

It also seeds a small set of income and expense records so summary endpoints are immediately testable.

## Setup

1. Install dependencies if needed:

   ```bash
   npm install
   ```

2. Copy environment values if you want custom configuration:

   ```bash
   cp .env.example .env
   ```

3. Start the API:

   ```bash
   npm run dev
   ```

4. The API will be available at:

   - `http://localhost:3000`
   - Root status: `http://localhost:3000/`
   - Swagger docs: `http://localhost:3000/api/docs`

Local development defaults to SQLite via:

- `DATABASE_URL=./data/finance-dashboard.sqlite`

To run against PostgreSQL instead:

- set `DATABASE_URL` to a `postgres://` or `postgresql://` connection string
- set `DATABASE_SSL=true` only if your PostgreSQL provider requires SSL

## Environment Variables

- `PORT`: HTTP server port. Default `3000`.
- `JWT_SECRET`: signing secret for JWT access tokens.
- `DATABASE_URL`: SQLite path for local use or PostgreSQL connection string for deployment.
- `DATABASE_SSL`: PostgreSQL SSL toggle. Default `false`.
- `DB_POOL_MAX`: PostgreSQL connection pool size. Default `10`.
- `RATE_LIMIT_WINDOW_MS`: rate-limit window in milliseconds.
- `RATE_LIMIT_MAX`: maximum requests allowed in the rate-limit window.

## Available Scripts

- `npm start` - start the server
- `npm run dev` - start with nodemon
- `npm test` - run the automated test suite

## Render Deployment

The repository includes [render.yaml](/Users/ayushrahate/Documents/assign-zrwyn/render.yaml), which provisions:

- a Node web service
- a Render Postgres database
- a generated `JWT_SECRET`
- a root `/` route that returns API status and entry-point links
- `DATABASE_URL` wired from the database's private `connectionString`
- a `/health` health check
- Swagger docs that work from the deployed service's own domain

Recommended deploy flow:

1. Push this repository to GitHub.
2. In Render, create a new Blueprint and point it at the repo.
3. Review the generated web service and Postgres database from `render.yaml`.
4. Sync the Blueprint to create both resources.
5. Open the deployed `/api/docs` endpoint after the first successful deploy.

Why this setup:

- Render Blueprint `fromDatabase.connectionString` resolves to the private/internal database URL, which is the preferred low-latency path for services running in the same Render region.
- PostgreSQL avoids the persistence limitations that SQLite would have on ephemeral web-service filesystems.
- The OpenAPI `servers` value is set to `/`, so Swagger "Try it out" uses the same origin in both local and deployed environments.

## API Overview

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Users (`admin` only)

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/users/:id/restore`

Supported user query params:

- `role`
- `status`
- `search`
- `includeArchived`
- `page`
- `pageSize`

### Financial Records

- `GET /api/records` - `analyst`, `admin`
- `GET /api/records/:id` - `analyst`, `admin`
- `POST /api/records` - `admin`
- `PATCH /api/records/:id` - `admin`
- `DELETE /api/records/:id` - `admin`
- `POST /api/records/:id/restore` - `admin`

Supported record filters:

- `type`
- `category`
- `startDate`
- `endDate`
- `minAmount`
- `maxAmount`
- `search`
- `sortBy`
- `sortOrder`
- `page`
- `pageSize`

### Dashboard Summary

- `GET /api/dashboard/summary` - `viewer`, `analyst`, `admin`
- `GET /api/dashboard/insights` - `analyst`, `admin`

Supported summary query params:

- `startDate`
- `endDate`
- `granularity=monthly|weekly`
- `limitRecent`

Supported insights query params:

- `startDate`
- `endDate`
- `granularity=monthly|weekly`
- `categoryLimit`

## Example Requests

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finance.local","password":"Admin123!"}'
```

Create a record as admin:

```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"amount":149.99,"type":"expense","category":"Software","occurredOn":"2026-04-01","notes":"License renewal"}'
```

Fetch dashboard summary:

```bash
curl http://localhost:3000/api/dashboard/summary?granularity=monthly \
  -H "Authorization: Bearer <token>"
```

## Error Response Shape

Validation and business-rule failures return structured JSON:

```json
{
  "error": {
    "message": "Validation failed.",
    "details": [
      "\"amount\" is required"
    ]
  }
}
```

## Project Structure

```text
src/
  app.js
  server.js
  config/
  db/
  middleware/
  modules/
    auth/
    dashboard/
    records/
    users/
  utils/
tests/
```

## Quality Notes

- Business rules are kept in service modules, not route handlers.
- Shared middleware handles authentication, authorization, validation, and error formatting.
- The database schema is auto-created on boot and reseeded in tests for deterministic behavior.
- The database adapter automatically selects SQLite or PostgreSQL based on `DATABASE_URL`.
- There is a guard to prevent removing the final active admin account.
- User archival preserves audit references while still supporting lifecycle management.
- Records can be restored after soft deletion instead of being lost permanently.
- Health responses include a simple database connectivity check.
- Swagger UI is exposed for quick evaluator access.

## Test Coverage

The included Jest/Supertest suite verifies:

- authentication
- role-based access restrictions
- record listing and CRUD behavior
- user lifecycle behavior
- dashboard aggregate correctness
- insights access and business metrics
- restore flows for archived users and deleted records
