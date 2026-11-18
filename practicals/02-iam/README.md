# Practical 02 — IAM, MFA & RBAC (local, runnable)

This practical turns the IAM/MFA/RBAC material from an IaC-only/conceptual topic
into something you can **actually execute on your own machine**. Everything here
is local-only: no AWS account, no credentials, no cloud calls, no paid services,
and no third-party Python packages.

Two layers are demonstrated:

1. **Python CLI** (`totp_demo.py` / `iam_local.py`) — a real TOTP engine and a
   small IAM engine with principals, groups, roles, policies, MFA-gated role
   switching and an audit log.
2. **Running Go backend** (`verify_api.ps1`) — real JWT authentication and real
   server-side RBAC denial on mutating HTTP endpoints.

---

## 1. Requirements

- Python 3.8+ (standard library only: `hmac`, `hashlib`, `base64`, `secrets`,
  `json`, `argparse`, `struct`, `fnmatch`, `urllib.parse`).
- Docker Desktop with the project stack running for the API part (optional).

No `pip install`. No AWS CLI configuration. No network access required.

---

## 2. Quick start

From the repository root:

```powershell
# Full end-to-end transcript (users, groups, MFA, least privilege, role switch, audit)
python practicals/02-iam/totp_demo.py demo

# Same entry point under an identity-friendly name
python practicals/02-iam/iam_local.py demo

# Individual commands
python practicals/02-iam/totp_demo.py init
python practicals/02-iam/totp_demo.py enroll alice
python practicals/02-iam/totp_demo.py code alice
python practicals/02-iam/totp_demo.py verify alice <6-digit-code>
python practicals/02-iam/totp_demo.py check alice deploy:prod
python practicals/02-iam/totp_demo.py switch alice deployer <6-digit-code>
python practicals/02-iam/totp_demo.py show
```

Outputs:

- `practicals/02-iam/data/iam_store.json` — local principals, groups, roles,
  TOTP secrets, policies and the in-memory audit trail.
- `evidence/iam/audit_log.json` — append-style JSON audit log (CloudTrail analogue).
- `evidence/iam/iam_demo_output.txt` — captured transcript (we captured the
  `demo` run there).

---

## 3. AWS IAM concepts → local equivalents

| AWS IAM concept | Local equivalent in this practical | Where it lives |
|---|---|---|
| IAM user | Local principal record (`alice`, `bob`, `carol`, `dave`) | `iam_store.json → users` |
| IAM group → role | `groups["ops"].roles = ["deployer"]`: group membership grants the ability to assume a role (trust-policy analogue) | `iam_store.json → groups` |
| IAM policy | Permission string list per role, e.g. `viewer = ["read:*"]`, `admin = ["*"]` | `ROLE_POLICIES` / `roles` in store |
| IAM role | Named permission set (`viewer`, `deployer`, `admin`) | `iam_store.json → roles` |
| Permission boundary | `bob` (deployer) can `deploy:*` but cannot `iam:createuser`; viewer cannot deploy | `check_permission()` |
| MFA (virtual TOTP device) | RFC 6238 TOTP: HMAC-SHA1 + base32 secret + 6 digits + 30 s step, `±1` step verification window | `totp_at()`, `verify_totp()` |
| STS `AssumeRole` | `switch_role()` — validates MFA first, then temporarily replaces the session role | `switch_role()` |
| CloudTrail | JSON event log with principal, action, decision, MFA flag and assumed role | `evidence/iam/audit_log.json` |
| JWT RBAC in the API | `role` claim in the signed JWT + `RequireMutate()` gate on POST/PUT/DELETE | `backend/internal/auth/auth.go`, `backend/cmd/server/main.go` |

### Role / permission matrix

| Role | `read:*` | `deploy:*` | `pipeline:trigger` | `iam:*` (all) |
|---|---|---|---|---|
| `viewer` | yes | no | no | no |
| `deployer` | yes | yes | yes | no |
| `admin` | yes (`*`) | yes (`*`) | yes (`*`) | yes (`*`) |

`admin` always passes `RequireRole`; every other role must be explicitly
allow-listed. `viewer` is deliberately read-only.

### How the TOTP works (no packages)

```
counter = floor(unix_time / 30)
mac     = HMAC-SHA1(base32_decode(secret), counter as 8-byte big-endian)
offset  = mac[19] & 0x0f
code    = (big-endian(mac[offset:offset+4]) & 0x7fffffff) % 1_000_000
```

`verify_totp()` recomputes for counters `t-1, t, t+1` and uses
`hmac.compare_digest` for constant-time comparison. The `otpauth://` URI printed
by `enroll` is accepted by standard offline authenticator apps if you want to
cross-check the generated code.

---

## 4. API layer — real server-side RBAC

The Go backend fixes two audit defects and enforces the role gate:

- `JWT_SECRET` is read from the environment at package init; the fallback is an
  obviously-labelled local-dev default, never the old hardcoded
  `ReplaceWithStrongSecret`.
- Every protected POST/PUT/DELETE route is wrapped with `writeGuard` →
  `auth.RequireMutate()`. Login, register and health stay public.
- Public registration is forced to `viewer`, so a caller cannot self-assign
  `admin` via the `role` JSON field.

Reproduce the API checks (requires the stack on `localhost:8080`):

```powershell
powershell -File practicals/02-iam/verify_api.ps1
```

The script logs in as `admin` (documented `admin/admin123`), acquires a JWT,
reads protected endpoints, creates a project as admin, registers a viewer, and
then shows **HTTP 403** for the viewer's POST and PUT attempts. It also checks
that the JWT signature matches the `JWT_SECRET` in `docker-compose.yml` and not
the old hardcoded value. Full command-by-command output is captured in
`evidence/iam/api_verification.txt`.

---

## 5. Honest scope note

**Real local enforcement:** TOTP generation/verification, permission decisions,
MFA-gated role switching, HTTP 403/401 responses from the running Go server,
JWT signature validation, and the JSON audit events are all executed locally and
are genuinely enforced by code.

**Conceptual mapping only:** the group→role trust relationship, STS
`AssumeRole`, CloudTrail and the "policy" strings are simplified local models,
not AWS APIs. No AWS service is contacted at any point. The Python role switch
is an in-process session change, not a real STS token exchange; the backend's
role comes from the JWT issued at login, not from the Python store.

See `evidence/iam/SUMMARY.md` for the exact commands, results and caveats.
