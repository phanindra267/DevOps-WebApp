# Practical 7 — DevSecOps Security Scanning (Trivy) — Evidence Summary

All results below are **real outputs** from an actual local Trivy execution. No findings are fabricated.
Raw machine-readable reports are the `*.json` files; human-readable tables are the `*.txt` files in this directory.

## Tooling

| Item | Value |
|---|---|
| Scanner | Aqua Security **Trivy** |
| Version | **0.76.2** (`trivy --version` -> `Version: 0.76.2`) |
| Install method | Official Windows amd64 binary `trivy_0.76.2_windows-64bit.zip` from GitHub releases, extracted to `security/bin/trivy.exe` (no system-wide service/install; no cloud or credentials) |
| Vulnerability DB | `mirror.gcr.io/aquasec/trivy-db:2`, downloaded on first run (133.70 MiB) and cached locally |
| Execution mode | 100% local. Scans ran against the local repo and the locally-built `int378-backend:latest` Docker image |
| Re-run script | `security/run_trivy_scan.ps1` |

## Scan commands executed (from repository root)

```powershell
# a. Filesystem / source repository
trivy fs     --format json -o evidence/security/trivy_fs.json            .
trivy fs     --format table -o evidence/security/trivy_fs.txt           .

# b. Locally-built container image
trivy image  --format json -o evidence/security/trivy_image_backend.json int378-backend
trivy image  --format table -o evidence/security/trivy_image_backend.txt int378-backend

# c. Infrastructure-as-Code / configuration
trivy config --format json -o evidence/security/trivy_iac.json          infrastructure
trivy config --format table -o evidence/security/trivy_iac.txt          infrastructure
```

All six scans completed with **exit code 0**. Scan timestamps (from JSON `CreatedAt`):
FS `2026-11-17T13:14:21+05:30`, IMAGE `2026-11-17T13:14:37+05:30`, IAC `2026-11-17T13:15:09+05:30`.

## Real finding counts (parsed from JSON `Results[].Severity`)

| Scan | Target | CRITICAL | HIGH | MEDIUM | LOW | UNKNOWN | Total |
|---|---|---:|---:|---:|---:|---:|---:|
| Filesystem | repo `.` (Go modules + npm lockfiles; vuln + secret scanners) | **4** | **43** | 45 | 5 | 2 | **99** |
| Image | `int378-backend:latest` (Alpine 3.19.9, Go binary) | **0** | **39** | 31 | 5 | 3 | **78** |
| IaC / config | `infrastructure` (17 config files, Terraform/Dockerfile) | **2** | **9** | 6 | 4 | 0 | **21** |

Counting method: every object in `Results[].Vulnerabilities`, `Results[].Misconfigurations`, and `Results[].Secrets`
was counted by its `Severity` field. `UNKNOWN` = severity not rated by the vendor. No `Secrets` findings were
produced in the FS or image scans (all FS/image findings were vulnerabilities; IAC findings were misconfigurations).

### Quality-gate assessment (per `security/security-policy.yaml`)

Policy: max **0 CRITICAL**, max **3 HIGH**, zero secrets. **All three scans fail the gate** as-is:

- Filesystem: 4 CRITICAL and 43 HIGH — **FAIL**.
- Image: 0 CRITICAL but 39 HIGH (> 3) — **FAIL**.
- IaC: 2 CRITICAL and 9 HIGH — **FAIL**.

These are genuine findings in the current codebase/image; this evidence is the baseline, not a passing gate.

## Notable findings (examples, not exhaustive — see JSON/txt for full lists)

### Filesystem CRITICAL (4)
| ID | Package | Installed | Fixed in | Issue |
|---|---|---|---|---|
| CVE-2025-29927 | `next` | 14.2.3 | 13.5.9 / 14.2.25 / 15.2.3 / 12.3.5 | Next.js middleware authorization bypass |
| CVE-2026-75604 | `next` | 14.2.3 | 15.5.24 / 16.3.3 | Unauthenticated RCE on Windows-hosted servers |
| GHSA-2464-fhr4-w9xw | `next` | 14.2.3 | 15.5.28 / 16.4.1 | Unauthenticated RCE via SVG image optimization |
| GHSA-2xp9-vwfh-vxw4 | `next` | 14.2.3 | 15.5.24 / 16.3.3 | Unauthenticated RCE via AVIF image optimization |

Representative HIGH: `github.com/golang-jwt/jwt/v5` v5.2.0 -> 5.2.2 (CVE-2025-30204);
`golang.org/x/crypto` v0.22.0 -> 0.31.0+ (CVE-2024-45337, CVE-2025-22869/47913, CVE-2026-xxxxx);
`axios` 1.7.2 -> 1.8.2/1.12.0/1.13.5 (CVE-2024-39338, CVE-2025-27152/58754, CVE-2026-25639).

### Image HIGH (39; no CRITICAL)
- OS packages: `musl` / `musl-utils` 1.2.4_git20230717-r5 -> -r6 (CVE-2026-40200).
- Trivy warned **Alpine 3.19.9 is no longer supported** by the distribution — security updates may be insufficient.
- Go deps mirror the FS findings: `golang-jwt/jwt/v5` v5.2.0 -> 5.2.2, `golang.org/x/crypto` v0.22.0 -> 0.55.0,
  Go `stdlib` v1.24.13 -> 1.26.10 / 1.27.3 (CVE-2026-111943, CVE-2026-25679), plus other HIGH CVEs.

### IaC CRITICAL (2) and HIGH (9)
- **CRITICAL AWS-0104**: security-group rule allows unrestricted egress to `0.0.0.0/0` (two occurrences, lines 59 and 85).
- HIGH: AWS-0107 unrestricted SSH/RDP ingress, AWS-0028 IMDSv2 not enforced, AWS-0131 unencrypted EBS volumes,
  AWS-0164 instances getting public IPs, AWS-0132 S3 encryption not using a customer-managed key,
  DS-0002 Docker image user is `root`.

## Remediation notes (prioritized)

1. **P0 — Next.js RCE/auth bypass (FS CRITICAL):** upgrade `next` from 14.2.3 to a fixed release (e.g. 14.2.25 minimum,
   preferably 15.5.28 / 16.4.1). This removes all 4 CRITICAL findings.
2. **P0 — IaC unrestricted egress (2 CRITICAL):** restrict security-group egress to required ports/CIDRs instead of `0.0.0.0/0`;
   remove 0.0.0.0/0 SSH/RDP ingress, enforce IMDSv2, enable EBS encryption, disable auto public IPs, and run containers as non-root.
3. **P1 — Go/npm HIGH CVEs (FS + image):** bump `golang-jwt/jwt/v5` to 5.2.2, `golang.org/x/crypto` to >= 0.55.0,
   Go toolchain/stdlib to >= 1.26.10 (or 1.27.3), and `axios` to >= 1.13.5, then rebuild the backend image.
4. **P1 — Refresh base image:** rebuild `int378-backend` on a currently-supported Alpine (or distroless) base to pick up the
   `musl` fix and drop the unsupported-OS warning.
5. Re-run `security/run_trivy_scan.ps1` after fixes and confirm counts drop within the policy thresholds.

## Security / privacy note

No real credentials or production secrets are contained in these reports. Any `JWT_SECRET`, API keys, or similar
values present in the repository are **local demo/development placeholders only** and must never be used in production.
The configured secret scanner reported **zero** secret findings in these runs. Do not commit real secrets; use a secret
manager and inject at runtime.

## Files created

- `security/bin/trivy.exe` (+ extracted `LICENSE`, `README.md`, `contrib/`, and the downloaded zip) — scanner binary, bundled locally.
- `security/run_trivy_scan.ps1` — reusable 3-scan runner (overwrite-safe).
- `evidence/security/trivy_fs.json` / `trivy_fs.txt` — filesystem scan.
- `evidence/security/trivy_image_backend.json` / `.txt` — backend image scan.
- `evidence/security/trivy_iac.json` / `.txt` — infrastructure config/IaC scan.
- `evidence/security/SUMMARY.md` — this file.

## Blockers

- None. GitHub REST API returned HTTP 403, but the direct release-asset download succeeded via `curl.exe` (resumed a
  partial download). Trivy DB downloaded successfully. All three scans executed locally with real results.
