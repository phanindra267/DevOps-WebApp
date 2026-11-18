# Practical 4 — Docker Containerization (Registry Lifecycle)

This folder is the Practical 4 submission note for the **registry / push-pull**
portion, which the existing Docker Hub script did not cover locally.

## What is demonstrated

A complete, credential-free image lifecycle against a local `registry:2`
container, mapped 1:1 to the AWS ECR workflow:

1. Start local registry → `docker compose -f docker-compose.registry.yml up -d`
2. Verify health → `GET http://localhost:5000/v2/` → `200 {}`
3. Tag → `docker tag alpine:latest localhost:5000/cloudops-demo:local`
4. Push (ECR push analogue) → `docker push localhost:5000/cloudops-demo:local`
5. Remove local tag → `docker rmi localhost:5000/cloudops-demo:local`
6. Pull back (ECR pull analogue) → `docker pull localhost:5000/cloudops-demo:local`
7. Run → `docker run --rm localhost:5000/cloudops-demo:local echo "..."`
8. Inspect → `GET http://localhost:5000/v2/_catalog`

The project's `int378-backend:latest` (49.7 MB) was also pushed as
`localhost:5000/int378-backend:local` to mirror a real application image.

## Artifacts

| Path | Description |
|---|---|
| `../../docker-compose.registry.yml` | Local registry service definition (port 5000, `registry_data` volume). |
| `../../scripts/local_registry_lifecycle.ps1` | Reproducible tag/push/remove/pull/run/catalog script. |
| `../../evidence/registry/registry_lifecycle.txt` | Real captured command output for the whole lifecycle. |
| `../../evidence/registry/README.md` | ECR ↔ local registry mapping, commands, real results and honest notes. |

## Quick reproduce

```powershell
cd "<repo root>"
docker compose -f docker-compose.registry.yml up -d
powershell -ExecutionPolicy Bypass -File .\scripts\local_registry_lifecycle.ps1 -IncludeBackend
```

The registry container is left running on port 5000; the volume persists all
pushed manifests and layers across restarts.
