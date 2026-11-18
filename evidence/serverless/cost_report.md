# LOCAL ESTIMATE — NOT ACTUAL AWS BILLING

> **LOCAL ESTIMATE — NOT ACTUAL AWS BILLING.** This report is produced by a
> fully offline teaching simulator. Every rate is a hard-coded illustrative
> value, every quantity is an assumed input. No AWS Pricing API, Cost Explorer,
> credentials, network call or paid service was used. Do not use these numbers
> to forecast or reconcile a real cloud invoice.

_Generated locally: 2026-11-17T07:38:23.995Z_

---

## 1. Methodology

Monthly cost = quantity × illustrative rate. Containers are costed by assumed
running hours; Lambda by request count plus GB-seconds; API Gateway by request
count; CloudWatch by ingest and stored GB; data transfer by GB out.

### Illustrative rate card (hard-coded, NOT AWS prices)

| Resource | Illustrative rate |
| --- | --- |
| Local container (running hour) | $0.05 / hour |
| Lambda requests | $0.20 / 1M requests |
| Lambda duration | $0.0000166667 / GB-second |
| API Gateway requests | $3.50 / 1M requests |
| CloudWatch Logs ingest | $0.50 / GB |
| CloudWatch Logs storage | $0.03 / GB-month |
| Data transfer out | $0.09 / GB |

### Assumed resource inventory (input, not measured)

| Local container | Assumed hours/day |
| --- | --- |
| cloudops-web | 24 |
| cloudops-backend | 24 |
| cloudops-postgres | 24 |
| cloudops-redis | 24 |
| prometheus | 24 |
| grafana | 12 |

- Lambda `cloudops-sentinel-lambda`: 1,200,000 invocations/month, 120 ms avg duration, 128 MB memory.
- API Gateway: 1,200,000 requests/month.
- CloudWatch Logs: 3 GB ingested/month, 6 GB stored, 30-day retention.
- Data transfer: 5 GB/month.

---

## 2. Simulated monthly cost — current scenario

| Line item | Simulated monthly cost (USD) |
| --- | --- |
| Containers (6 local containers) | $198.00 |
| Lambda — requests | $0.24 |
| Lambda — duration (18000.0 GB-s) | $0.30 |
| API Gateway — requests | $4.20 |
| CloudWatch Logs — ingest | $1.50 |
| CloudWatch Logs — storage | $0.18 |
| Data transfer out | $0.45 |
| **TOTAL (current, estimated)** | **$204.87** |

---

## 3. Optimization recommendations & simulated savings

| # | Recommendation | Simulated monthly saving |
| --- | --- | --- |
| 1 | Schedule non-prod local containers off outside business hours (24h -> 12h/day) | $90.00 |
| 2 | Reduce Lambda duration 120 ms -> 80 ms (connection reuse, init outside handler) | $0.10 |
| 3 | Client-side caching: API Gateway 1,200,000 -> 960,000 requests/month | $0.89 |
| 4 | Trim verbose logs and cut CloudWatch retention 30 -> 7 days | $0.64 |
| 5 | Enable payload compression to cut transfer 5 -> 3 GB | $0.18 |

### Optimized scenario summary

| Line item | Simulated monthly cost (USD) |
| --- | --- |
| Containers | $108.00 |
| Lambda — requests | $0.24 |
| Lambda — duration | $0.20 |
| API Gateway — requests | $3.36 |
| CloudWatch Logs — ingest + storage | $1.04 |
| Data transfer out | $0.27 |
| **TOTAL (optimized, estimated)** | **$113.12** |

**Simulated total savings: $91.76 / month (44.8% reduction).**

---

## 4. Disclaimer

**LOCAL ESTIMATE — NOT ACTUAL AWS BILLING.** Nothing in this report came from
an AWS account, a billing API, or a live resource. The container names are local
Docker service names, not billed AWS resources. All rates and quantities are
illustrative teaching inputs. For a real FinOps exercise, replace the rate card
and inventory with data from AWS Cost Explorer / the AWS Pricing API.

