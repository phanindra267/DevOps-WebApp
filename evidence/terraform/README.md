# Terraform local run evidence (Practical 5 + Practical 1)

This directory contains **real console output** captured while provisioning local
Docker infrastructure with Terraform on Windows / Docker Desktop. Nothing here is
hand-written simulation output; only the ANSI color escape codes were stripped
from the captured log for readability.

## Environment

- Terraform v1.16.1 (windows_amd64)
- Docker Engine 29.4.3 (Docker Desktop, Linux engine via `npipe:////./pipe/dockerDesktopLinuxEngine`)
- Provider: `kreuzwerker/docker` v3.9.0 (downloaded during `terraform init`)
- Working directory: `infrastructure/terraform/local`
- Date: 2026-11-17

## Commands actually run (in order)

1. `terraform init` -> exit 0 — provider `kreuzwerker/docker v3.9.0` installed, `.terraform.lock.hcl` created.
2. `terraform validate` -> exit 0 — "Success! The configuration is valid."
3. `terraform plan -out=tfplan` -> exit 0 — `Plan: 8 to add, 0 to change, 0 to destroy.`
4. `terraform apply -auto-approve tfplan` -> exit 0 — `Apply complete! Resources: 8 added, 0 changed, 0 destroyed.`
5. `Invoke-WebRequest http://localhost:8088` -> **HTTP 200**, body contains `TF-LOCAL-WEBSERVER-OK`.
6. `docker ps --filter name=tf-local-` -> both `tf-local-webserver` and `tf-local-private-app` RUNNING.
7. `docker network inspect` -> `tf-local-public` contains only `tf-local-webserver`; `tf-local-private` contains only `tf-local-private-app` (isolation confirmed).
8. `terraform state list` and `terraform output` -> exit 0.

A first attempt at `docker network inspect tf-local-public,tf-local-private` failed with
`Error response from daemon: network tf-local-public,tf-local-private not found`. The real
error is recorded in `verification.txt`; the command was fixed by passing the two network
names as separate arguments and re-run successfully.

## Evidence files

- `terraform_run.txt` — full real output of init, validate, plan and apply (with exit codes).
- `verification.txt` — HTTP response (status + body), marker check, container status, network membership.
- `state_summary.txt` — output of `terraform state list` and `terraform output`.

## AWS -> local Docker mapping

| AWS concept (Practical 1) | Local resource created by Terraform (Practical 5) |
| --- | --- |
| VPC / public subnet | `docker_network` `tf-local-public` (`240e0a901e75...`) |
| VPC / private subnet | `docker_network` `tf-local-private` (`03458ae08d10...`) |
| Security group / subnet isolation | separate bridge networks; containers cannot see each other |
| EBS volume | `docker_volume` `tf-local-webdata` |
| EC2 instance / AMI | `docker_image` `nginx:alpine` and custom `tf-local-webserver:latest` built from `web/Dockerfile` |
| EC2 instance running Nginx | `docker_container` `tf-local-webserver`, host `8088` -> container `80` |
| Private EC2 instance | `docker_container` `tf-local-private-app` (alpine `sleep infinity`, no published ports) |

## Result

Apply succeeded. The web server is intentionally left **RUNNING** at
`http://localhost:8088`. No cloud calls, credentials, or paid services were used.
To tear down later: `cd infrastructure/terraform/local; terraform destroy -auto-approve`.
