# Practical 02 (IAM / MFA / RBAC) — Execution Summary

**Date:** 2026-11-17
**Scope:** 100% local. No AWS, no credentials, no cloud APIs, no paid services.
Docker Desktop was already running; only the `backend` service was rebuilt/recreated.

---

## 1. Files changed / created

Backend (owned area):

- `backend/internal/auth/auth.go` — `JWT_SECRET` env lookup at init with a
  labelled local-only fallback (`defaultJWTSecret`); HMAC-only signing-method
  check; new `RequireRole(...)` / `RequireMutate()` role-gate middleware.
- `backend/internal/auth/handler.go` — public registration now always creates
  `viewer` (ignores client-supplied `role`), preventing self-escalation to admin.
- `backend/internal/auth/auth_test.go` — added tests for env/default secret and
  for the admin/editor/viewer/anonymous role gate.
- `backend/cmd/server/main.go` — every protected POST/PUT/DELETE is wrapped in
  `writeGuard(...)` → `auth.RequireMutate()`. Login, register and health remain
  public; GET routes remain readable by any authenticated role.
- `backend/Dockerfile` — runtime stage changed from `alpine:3.19` +
  `apk --no-cache add ca-certificates curl` to locally cached `alpine:latest`
  with no `apk` step, so the image can be rebuilt with no network. The static
  Go binary needs neither package.

New practical/evidence files:

- `practicals/02-iam/totp_demo.py` — stdlib-only TOTP + local IAM engine + CLI.
- `practicals/02-iam/iam_local.py` — alias entry point.
- `practicals/02-iam/verify_api.ps1` — reproducible local API check script.
- `practicals/02-iam/README.md` — AWS concept → local equivalent documentation.
- `practicals/02-iam/data/iam_store.json` — generated local store.
- `evidence/iam/go_tests.txt`, `evidence/iam/iam_demo_output.txt`,
  `evidence/iam/api_verification.txt`, `evidence/iam/audit_log.json`.

Nothing under `ci/`, `frontend/`, `infrastructure/`, `security/`,
`serverless/`, `scripts/`, `docs/` or `docker-compose.yml` was modified.

---

## 2. Commands actually run and results

### 2.1 Go tests

```
cd backend
gofmt -w ./cmd/server/main.go ./internal/auth/auth.go ./internal/auth/auth_test.go ./internal/auth/handler.go
go test ./...
```

All packages passed, including the new auth tests:

```
ok  cloudops-sentinel/internal/auth        11.832s
ok  cloudops-sentinel/internal/cloud       (cached)
ok  cloudops-sentinel/internal/cost        (cached)
ok  cloudops-sentinel/internal/project     11.589s
ok  cloudops-sentinel/internal/syllabus    (cached)
```

Full output: `evidence/iam/go_tests.txt`.

### 2.2 Python IAM/TOTP CLI

```
python practicals/02-iam/totp_demo.py demo
```

The transcript shows real results (full stdout in `evidence/iam/iam_demo_output.txt`):

- base32 secret enrolled for `alice`; current TOTP generated and printed;
- current code accepted at step delta 0, previous-step accepted at -1,
  next-step accepted at +1 (verification window `±1`), bogus code rejected;
- `alice` (viewer) `deploy:prod` → **DENIED**; `bob` (deployer) `deploy:prod`
  → ALLOWED but `iam:createuser` → DENIED; `carol` (admin) both → ALLOWED;
- `alice` assumes `deployer` with a valid TOTP → deploy now ALLOWED;
  assume `admin` without a granting group → DENIED; assume `deployer` with a
  bad code → DENIED (intentional failure case); session role unchanged after
  failed switches;
- 15 audit events written to `evidence/iam/audit_log.json`, 4 of them DENIED.

`python practicals/02-iam/iam_local.py demo` uses the same implementation and
was smoke-tested along with `code`, `verify` and `check` subcommands.

### 2.3 Backend rebuild and API verification

```
docker compose build backend
docker compose up -d --force-recreate backend
powershell -File practicals/02-iam/verify_api.ps1
```

First build attempt failed: BuildKit could not fetch `alpine:3.19` metadata and
`apk add` could not reach dl-cdn.alpinelinux.org (TLS certificate untrusted).
After the offline Dockerfile change, the rebuild succeeded using the cached
`golang:1.24-alpine` and `alpine:latest` images; no external registry or package
mirror was used. `up` produced an unrelated warning about an orphan
`cloudops-local-registry` container belonging to another workflow — it was not
touched, and no `--remove-orphans` was used. The backend container came up and
logged `CloudOps Sentinel API listening on :8080`.

API results (full command-by-command output in `evidence/iam/api_verification.txt`):

| Check | Result |
|---|---|
| `GET /api/v1/health` | 200 |
| `POST /api/v1/login` as `admin/admin123` | 200 + JWT |
| JWT signature matches `JWT_SECRET` from compose | **True** |
| JWT signature matches old hardcoded secret | **False** |
| Admin `GET /me`, `GET /projects` | 200 |
| Admin `POST /projects` | 201 (created id 3) |
| Public `POST /register` with `role:"admin"` | 201, role forced to viewer |
| Viewer `GET /me`, `GET /projects` | 200 (reads allowed) |
| Viewer `POST /projects` | **403** `forbidden: role viewer is not permitted for this action` |
| Viewer `PUT /projects/3` | **403** |
| `POST /projects` with no token | **401** `missing auth token` |

---

## 3. Local DB note (important, honest)

`scripts/init-db.sh` documents admin password `admin123`, but its seeded bcrypt
hash did not match either `admin123` or `password` (confirmed offline with Go's
`bcrypt.CompareHashAndPassword`; a known bcrypt vector was used to validate the
checker itself). Both candidate logins returned 401 against the original stack.

To get a working documented credential for API verification, **only the local
Docker Postgres dev database row was updated**:

```
UPDATE users SET password_hash = '<fresh bcrypt hash of admin123>' WHERE username = 'admin';
```

`scripts/init-db.sh` was **not** modified. The frontend's separate `cloudops`
admin account was not changed.

---

## 4. Real enforcement vs conceptual mapping

**Real local enforcement (executed, not mocked):**

- TOTP codes are computed with RFC 6238 HMAC-SHA1 and verified with a real
  `±1` step window and constant-time comparison.
- Permission checks and MFA-gated role switches execute real Python code and
  produce real ALLOWED/DENIED audit records.
- The Go API rejects viewer writes with HTTP 403 and missing tokens with 401.
  The role comes from the verified JWT, and mutating routes are gated
  server-side; changing the frontend cannot bypass it.
- JWT signing key is genuinely read from `JWT_SECRET` (signature check above).

**Conceptual / simplified (documented mapping, not AWS):**

- `groups → roles` models an IAM trust relationship; it is a Python dict, not
  an AWS trust policy.
- `switch_role` is an in-process session change, not an STS token exchange.
- `ROLE_POLICIES` are simplified permission strings with wildcard matching,
  not full IAM policy grammar.
- `audit_log.json` is a local JSON log, not CloudTrail.
- No AWS SDK calls are made by the Python practical. The Go backend's cloud
  package continues in its existing cost-free local-fallback mode.

---

## 5. Blockers / caveats

- No outstanding functional blockers; all required checks passed locally.
- The original Dockerfile could not build in this offline environment; the
  backend Dockerfile was made offline-buildable (see §1). If network access is
  available later, restoring `alpine:3.19` + `apk add` is safe for the app,
  but the offline form is preferable for this local-first project.
- Public registration hardening (force `viewer`) and the local password reset
  are local-dev decisions; they are documented here so they are not mistaken
  for original repository state.
- Demo secrets are random per run; `evidence/iam/iam_demo_output.txt` and
  `evidence/iam/audit_log.json` correspond to the final demo run captured after
  all smoke tests.
