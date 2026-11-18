# Local Docker Registry Evidence — INT 378 Practical 4

**Goal:** Demonstrate the image-registry half of Practical 4 (tag / push / pull / run)
using a **fully local** `registry:2` container instead of AWS ECR or Docker Hub.

**Constraint compliance:** 100% local. No AWS account, no AWS credentials, no cloud
API calls, no external-registry pushes, no paid registries. `docker-compose.yml` and
all other owned files were left untouched. The only Docker Hub interaction was a
one-time pull of the official open-source `registry:2` base image to run the registry
itself (same as pulling any other base image already used in this repo).

---

## 1. AWS ECR → local registry mapping

| Concept / step | AWS ECR (cloud) | This local setup |
|---|---|---|
| Registry service | ECR repository / AWS-managed registry | `registry:2` container, `cloudops-local-registry` |
| Endpoint | `<acct>.dkr.ecr.<region>.amazonaws.com` | `localhost:5000` |
| Auth | `aws ecr get-login-password` + `docker login` | **None** — Docker treats `localhost` as an insecure registry by default; plain HTTP works |
| Create repository | `aws ecr create-repository --repository-name ...` | No pre-create needed; registry auto-creates a repo on first push |
| Tag | `docker tag app <acct>.dkr.ecr.../app:v1` | `docker tag alpine:latest localhost:5000/cloudops-demo:local` |
| Push | `docker push <acct>.dkr.ecr.../app:v1` | `docker push localhost:5000/cloudops-demo:local` |
| Pull | `docker pull <acct>.dkr.ecr.../app:v1` | `docker pull localhost:5000/cloudops-demo:local` |
| List repositories | `aws ecr describe-repositories` | `curl http://localhost:5000/v2/_catalog` |
| List tags | `aws ecr list-images` | `curl http://localhost:5000/v2/<repo>/tags/list` |
| Persistence | ECR (managed, durable) | Named volume `int378_registry_data` → `/var/lib/registry` on this host |
| Health check | AWS console / API | `curl -i http://localhost:5000/v2/` → `200` with body `{}` |
| Cost | Storage + data transfer | Free, on-prem, no egress |

> **Teaching note:** the workflow commands are identical apart from the registry
> hostname and the login step. Removing `docker login` is the practical difference
> that makes this safe to run with no credentials at all.

---

## 2. Files created

| File | Purpose |
|---|---|
| `docker-compose.registry.yml` | Defines the `registry:2` service (`cloudops-local-registry`, `5000:5000`, `registry_data` volume, `restart: unless-stopped`). No registry UI — kept lightweight. |
| `scripts/local_registry_lifecycle.ps1` | Reproducible tag → push → remove → pull → run → catalog script (with optional `-IncludeBackend`). |
| `evidence/registry/registry_lifecycle.txt` | **Real** captured output of every command in the lifecycle. |
| `evidence/registry/README.md` | This document. |
| `practicals/04-docker/README.md` | Short practical-4 submission note (optional helper). |

---

## 3. Commands used (exact)

```powershell
# Start the local registry (one time)
docker compose -f docker-compose.registry.yml up -d
curl.exe -i http://localhost:5000/v2/          # -> HTTP/1.1 200 OK, body {}

# Reproduce the full lifecycle (assumes registry is up)
powershell -ExecutionPolicy Bypass -File .\scripts\local_registry_lifecycle.ps1 -IncludeBackend `
  2>&1 | Tee-Object -FilePath .\evidence\registry\registry_lifecycle.txt
```

Inside the script (all against `localhost:5000`):

```bash
docker tag alpine:latest localhost:5000/cloudops-demo:local
docker push localhost:5000/cloudops-demo:local
curl  http://localhost:5000/v2/_catalog
docker rmi localhost:5000/cloudops-demo:local      # simulate clean client
docker pull localhost:5000/cloudops-demo:local
docker run --rm localhost:5000/cloudops-demo:local echo "Hello from the LOCAL registry at localhost:5000"
curl  http://localhost:5000/v2/_catalog
# optional production analogue:
docker tag int378-backend:latest localhost:5000/int378-backend:local
docker push localhost:5000/int378-backend:local
```

**Ports:** host `5000` → container `5000` (Registry HTTP API). No other ports opened.
No `registry-ui` was added — the HTTP API plus `curl` is sufficient and lighter.

---

## 4. Real results (from `registry_lifecycle.txt`)

- Registry started: `Container cloudops-local-registry Created / Started`.
- Health: `GET /v2/` → `HTTP/1.1 200 OK`, `Docker-Distribution-Api-Version: registry/2.0`, body `{}`.
- Initial catalog (before first push in the first run): `{"repositories":[]}`.
- Demo push: `local: digest: sha256:0f49f331d9212aff11b932863be4eb01cdf962969aa86dab7d1ee21ac6f5f52b size: 1022` (13 MB image; first run showed the layer being `Pushed`, re-run showed `Layer already exists`).
- After removing the local tag, `docker pull localhost:5000/cloudops-demo:local` succeeded with the same digest — proving the image came from the **local registry**, not a cache.
- `docker run --rm ...` printed the exact proof line:
  `Hello from the LOCAL registry at localhost:5000`
- Backend push: `int378-backend:latest` (49.7 MB, ID `592b868a0c9c`) tagged/pushed as `localhost:5000/int378-backend:local`, digest `sha256:592b868a0c9cb08f42a62705a6974d88ff4f02be22ad59abe9be8d200850cde1 size: 856`.
- Final catalog: `{"repositories":["cloudops-demo","int378-backend"]}`
- Final tag listings: `{"name":"cloudops-demo","tags":["local"]}` and `{"name":"int378-backend","tags":["local"]}`.
- Final container state: `cloudops-local-registry | registry:2 | Up ... | 0.0.0.0:5000->5000/tcp`.
- Volume: `int378_registry_data | local`.

All commands exited `0`. No output in this folder is fabricated; it is a direct
`Tee-Object` capture of the console.

---

## 5. Honest notes / limitations

1. **Insecure by design.** The registry speaks plain HTTP on port 5000. This is fine
   for a local lab because Docker exempts `localhost` from TLS enforcement. Do not
   expose `5000` to an untrusted network or reuse these settings in production —
   a real ECR-equivalent needs TLS, auth and network controls.
2. **One-time base-image pull.** Pulling `registry:2` from Docker Hub was necessary
   to obtain the registry binary. It initially failed with repeated transient
   `502 Too many open files` errors from Docker Hub's CDN; retries succeeded because
   each attempt cached another layer. After that, the entire lifecycle used only
   locally cached images / the local registry — no further external pulls.
3. **`hello-world` not used.** The task suggested `hello-world:latest` or cached
   `alpine:latest`. `alpine:latest` (13 MB) was already cached, so it was chosen to
   guarantee a fast, network-independent run.
4. **Multi-platform notice.** Docker 29 emitted an informational message that not all
   multi-platform content was present and only the available single-platform image
   was pushed. This is normal for a locally built/cached single-arch image and did
   not affect push, pull or run.
5. **Compose orphan warning.** Because the single compose file defines only the
   registry service, Docker warned about "orphan containers" from the main
   `docker-compose.yml` stack. It is a harmless informational warning from sharing
   one Docker Compose project name; the main stack was left running untouched.
6. **Registry left running** on port 5000 as requested. Stop it with
   `docker compose -f docker-compose.registry.yml down` (use `-v` to also delete
   pushed images from the `registry_data` volume).
