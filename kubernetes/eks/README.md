# CloudOps Sentinel on Amazon EKS (Kubernetes)

These manifests deploy the application onto the EKS cluster created by either:

- **Terraform:** `infrastructure/terraform/aws-complete/` (module `eks.tf`), or
- **CloudFormation:** `infrastructure/cloudformation/eks-cluster.yaml`

## Replace the `XX` placeholders

| File | Placeholders |
|---|---|
| `namespace.yaml` | environment label |
| `configmap.yaml` | `DB_HOST` (RDS endpoint), `DB_NAME`, `AWS_REGION`, `ENVIRONMENT` |
| `secret.yaml` | `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `GITHUB_TOKEN` |
| `serviceaccount.yaml` | IRSA IAM role ARN (created by Terraform/CloudFormation OIDC setup) |
| `deployment.yaml` | ECR image repository/tag, image pull secret |
| `frontend-deployment.yaml` | ECR image repository/tag, public API URL, pull secret |
| `ingress.yaml` | ACM certificate ARN, TLS host, DNS host, secret name |
| `networkpolicy.yaml` | RDS endpoint CIDR |

> Prefer AWS Secrets Manager + External Secrets Operator over plain Kubernetes Secrets in real
> deployments. The `XX` values intentionally prevent accidental deployment.

## Deploy

```powershell
# 1. Point kubectl at the EKS cluster (Terraform output `configure_kubectl`)
aws eks update-kubeconfig --region XX --name XX

# 2. Install the AWS Load Balancer Controller (for the ALB Ingress) and Metrics Server (for the HPA)
helm repo add eks https://aws.github.io/eks-charts
helm upgrade -i aws-load-balancer-controller eks/aws-load-balancer-controller -n kube-system --set clusterName=XX --set serviceAccount.create=false --set serviceAccount.name=aws-load-balancer-controller

# 3. Apply all manifests
kubectl apply -f kubernetes/eks/

# 4. Verify
kubectl get pods,svc,ingress,hpa -n cloudops-sentinel
kubectl get ingress cloudops-sentinel-ingress -n cloudops-sentinel -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

## Observability on the cluster

Prometheus + Grafana can be installed with Helm and pointed at the metrics endpoints:

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade -i kube-prometheus-stack prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

The existing `monitoring/` folder contains Prometheus scrape config, alert rules and Grafana
dashboard JSON that can be reused.
