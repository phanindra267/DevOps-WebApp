# Individual AWS Components (no CloudFormation)

Each mandatory CA component is implemented **individually** as its own Terraform mini-stack.
Because the AWS account denies EC2/S3/VPC via an Organizations SCP, each component is
**demonstrated locally** with the Docker provider while mirroring the AWS resource:

| # | Component folder | AWS resource it represents | Local demo resource | Verified |
|---|---|---|---|---|
| 1 | `vpc/` | `aws_vpc` | `docker_network` `ca-vpc` | ✅ exists |
| 2 | `public-subnet/` | `aws_subnet` + IGW route (`MapPublicIpOnLaunch`) | `docker_network` `ca-public-subnet` (`internal=false`) | ✅ exists |
| 3 | `private-subnet/` | `aws_subnet` + own route table, no NAT | `docker_network` `ca-private-subnet` (`internal=true`) | ✅ exists |
| 4 | `ec2/` | `aws_instance` (t2.micro, Amazon Linux, Nginx) | `docker_container` `ca-ec2-webserver` on :8089 | ✅ HTTP 200 |
| 5 | `s3/` | `aws_s3_bucket` (versioning, AES-256, public block) | `docker_container` registry + persistent volume on :5002 | ✅ HTTP 200 |

Each folder has `main.tf`, `versions.tf` and its own `terraform.tfstate` — so each component is
independently `init / validate / apply / destroy`-able.

## Run all components (dependency order)

```powershell
foreach ($c in 'vpc','public-subnet','private-subnet','ec2','s3') {
  Push-Location "infrastructure/individual/$c"
  terraform init
  terraform validate
  terraform apply -auto-approve
  Pop-Location
}
```

## Verify

```powershell
docker network inspect ca-vpc
docker network inspect ca-public-subnet --format '{{.Internal}}'   # false = public
docker network inspect ca-private-subnet --format '{{.Internal}}'  # true = private
curl http://localhost:8089        # EC2 Nginx web server page
curl http://localhost:5002/v2/    # S3 object-store analog -> {}
```

## Destroy (clean up)

```powershell
foreach ($c in 's3','ec2','private-subnet','public-subnet','vpc') {
  Push-Location "infrastructure/individual/$c"; terraform destroy -auto-approve; Pop-Location
}
```

## For real AWS deployment

Replace the `docker` provider in each `versions.tf` with `hashicorp/aws` and swap the resource
for its AWS equivalent (column 2 above). The full AWS versions already exist in
`infrastructure/terraform/aws-complete/` and `infrastructure/cloudformation/`.
