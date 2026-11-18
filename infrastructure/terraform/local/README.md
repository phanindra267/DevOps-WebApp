# Local Terraform infrastructure (Docker provider)

This directory provisions **real local Docker resources** with the
`kreuzwerker/docker` provider. It simulates the Practical 1 (EC2 / VPC / Nginx
web server) and Practical 5 (Terraform) exercises without any AWS account,
credentials, or cloud calls. Everything runs on the local Docker Desktop
Linux engine over the Windows named pipe.

All resource names are prefixed `tf-local-` so they never clash with the
existing `cloudops-*` containers from `docker-compose.yml`.

## AWS -> local mapping

| AWS concept | Local Docker resource |
| --- | --- |
| VPC / public subnet | `docker_network.tf-local-public` |
| VPC / private subnet | `docker_network.tf-local-private` |
| Security groups / subnet isolation | separate bridge networks (no route between them) |
| EBS volume | `docker_volume.tf-local-webdata` |
| EC2 instance (AMI) | `docker_image` + `docker_container.tf-local-webserver` |
| Nginx web server | custom image built from `./web` (Dockerfile + index.html) |
| Port mapping 80 -> host 8088 | `docker_container.ports { internal = 80, external = 8088 }` |
| Private instance | `docker_container.tf-local-private-app` (alpine sleep, no ports) |

## Files

- `versions.tf` - required Terraform/provider versions and the Docker provider block.
- `variables.tf` - prefix and port/tag variables (defaults are ready to use).
- `terraform.tfvars.example` - example overrides; copy to `terraform.tfvars` if needed.
- `main.tf` - all resources described above.
- `outputs.tf` - `web_url`, network IDs, container IDs, volume name.
- `web/Dockerfile` + `web/index.html` - custom Nginx page baked into the image.

## Run

```powershell
cd infrastructure/terraform/local
terraform init
terraform validate
terraform plan -out=tfplan
terraform apply -auto-approve tfplan
```

Verify: `http://localhost:8088` should serve the `TF-LOCAL-WEBSERVER-OK` page.

Tear down (only when you are done with the evidence):

```powershell
terraform destroy -auto-approve
```

> The web server is intentionally left RUNNING after apply so the URL can be
> verified. Evidence of the real run lives in `evidence/terraform/`.

## Requirements

- Docker Desktop running on Windows with the Linux engine.
- Terraform >= 1.0.
- Internet access is needed only the first time, to download the
  `kreuzwerker/docker` provider plugin during `terraform init`.
