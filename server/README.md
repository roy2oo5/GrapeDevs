# PulseGrid API

FastAPI MVP for hospital registration, hospital-admin login, batch-level inventory, transfer requests, and dashboard totals. PostgreSQL is accessed with SQLAlchemy. Runtime environment variables take precedence; otherwise `server/.env` is loaded before the project-root `.env`.

## Layout

```text
server/
	app/
		api/routers/   HTTP routes grouped by domain
		core/          Settings and application lifecycle
		db/            SQLAlchemy base, engine, and sessions
		models/        Database tables
		schemas/       Request/response validation
		services/      Database health and external integrations
		main.py        FastAPI assembly and middleware
	scripts/         Local operational commands
	tests/           SQLite-backed API tests
	supabase/        SQL schema for Supabase
```

## Setup

Copy `.env.example` to `.env` in this directory and set the Supabase PostgreSQL connection string as `DATABASE_URL`. This server-local file takes precedence over the project-root `.env`. Install and run from this directory:

```powershell
Copy-Item .env.example .env
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Set `AUTH_TOKEN_SECRET` to a random secret of at least 32 characters. If it is unset, the backend derives a separate signing key from `SUPABASE_SECRET_KEY`. Rotating either source invalidates existing access tokens.

Run `python -m scripts.apply_schema` from this directory to migrate existing facility records and create/update the hospital schema. The migration renames tables/columns in place to preserve data. For a new database, execute [`supabase/schema.sql`](supabase/schema.sql) in Supabase SQL Editor. The app intentionally does not mutate production schema at startup. Keep database credentials server-side; never put a service-role key in frontend environment variables. If both the project-root `.env` and `server/.env` exist, the server-local file takes precedence.

## MVP routes

- `GET /api/health`: backend status and telemetry.
- `POST /api/auth/register`: create a hospital and its first hospital-admin account. Registration does not sign the user in.
- `POST /api/auth/login`: exchange `hospital_administrator_id` and `terminal_access_key` for a short-lived bearer token.
- `GET /api/auth/me`: return the identity associated with a valid bearer token.
- `GET /api/hospitals/me`: current authenticated hospital profile.
- `GET /api/dashboard`: current hospital inventory, near-expiry, and active-transfer totals.
- `GET|POST /api/inventory/batches`: list/filter batches and record a batch; `PATCH /api/inventory/batches/{id}` adjusts quantity. These require a bearer token. For `POST`, the hospital is derived from the authenticated admin; `hospital_id` is optional and may only match that hospital. `unit` and `storage_regime` default to `units` and `ambient`.
- `GET|POST /api/transfers`: list/filter and create a stock request; requires a bearer token.
- `PATCH /api/transfers/{id}`: advance a request through approved, in-transit, and completed, or reject/cancel it.

Register a hospital, then sign in with the hospital-admin ID and terminal access key provided during registration. The register endpoint stores only an scrypt hash and returns no login token; the separate login step returns the bearer token. Local operators can also create an additional administrator account:

```powershell
..\.venv\Scripts\python.exe -m scripts.create_hospital_admin --hospital-id <hospital-uuid> --administrator-id HOSP-ADMIN-0042
```

Login request body:

```json
{
	"hospital_administrator_id": "HOSP-ADMIN-0042",
	"terminal_access_key": "your-terminal-access-key"
}
```

Use the returned `access_token` as `Authorization: Bearer <token>`. Interactive OpenAPI docs are available at `/docs`. For isolated tests, install `requirements-dev.txt` and run `python -m pytest tests -q`; tests use SQLite and do not access Supabase. Test database connectivity with `python -m scripts.check_database` from `server/`.