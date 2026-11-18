# INT 378 — Practical 10: Serverless / Lambda Local Simulation

This directory demonstrates Practical 10 (Lambda / serverless simulation plus a
FinOps cost analysis) **entirely locally**. No AWS account, credentials, cloud
calls, pricing API or paid service is used anywhere in this practical.

> **DISCLAIMER:** Everything here is a **local estimate / simulation**.
> The cost report is explicitly labelled **LOCAL ESTIMATE — NOT ACTUAL AWS
> BILLING**. Its rates and quantities are hard-coded illustrative teaching
> values, not real AWS prices or measured usage.

## Files

| File | Purpose |
| --- | --- |
| `lambda/index.js` | The actual Lambda handler (pre-existing; unchanged). Exports `handler(event, context)`. |
| `template.yaml` | Pre-existing SAM template describing the Lambda, API Gateway, IAM role and CloudWatch log group (unchanged). |
| `local-runtime.js` | Local Lambda + API Gateway simulator that actually invokes the handler and captures CloudWatch-style logs. |
| `local_cost_simulator.js` | Offline, illustrative cost model that writes a markdown cost report. |
| `../evidence/serverless/` | Generated evidence: logs, stdout/stderr captures and the cost report. |

## How the AWS services map to the local runtime

| AWS service | Local simulation |
| --- | --- |
| AWS Lambda function + `index.handler` | `require('./lambda/index.js')` and call `handler(event, context)` in-process with Node. |
| API Gateway proxy event + `GET /health`, `POST /process` | `makeApiGatewayEvent()` builds a synthetic proxy event (`httpMethod`, `path`, `requestContext.identity.sourceIp`, `requestContext.stage`, etc.). |
| Lambda `context` object (`awsRequestId`, `memoryLimitInMB`, `logStreamName`, `getRemainingTimeInMillis`) | `makeContext()` emulates it with equivalent local values. |
| Warm / cold starts and execution-environment reuse | The first invocation has no `alreadyWarmed` flag → `coldStart: true`. The flag is carried into later invocations → `coldStart: false`, demonstrating warm reuse. |
| CloudWatch Logs (`/aws/lambda/cloudops-sentinel-lambda`) | `console.log` is temporarily intercepted during each call and written as CloudWatch-style `START` / structured JSON / `END` / `REPORT` lines to `evidence/serverless/cloudwatch_logs.txt`. |
| API Gateway HTTP response (`statusCode`, `headers`, `body`) | The handler's returned object is printed to stdout with its status code and body. A 200/200 check gates the exit code. |
| AWS Pricing API / Cost Explorer | Deliberately **not** used. A hard-coded illustrative rate card in `local_cost_simulator.js` stands in for it. |

## Run — one command per script

All commands are run from the repository root. Paths resolve relative to each
script (`__dirname`), so the working directory does not affect where evidence is
written.

### 1. Local Lambda / API Gateway invocation

```powershell
& "C:\Program Files\nodejs\node.exe" serverless\local-runtime.js
```

To capture real stdout/stderr into evidence:

```powershell
cmd /c '"C:\Program Files\nodejs\node.exe" "serverless\local-runtime.js" > "evidence\serverless\invocation_output.txt" 2>&1'
```

Outputs: three invocations (1 cold + 2 warm), each expected `HTTP 200`, and
`evidence/serverless/cloudwatch_logs.txt`.

### 2. Offline cost estimate

```powershell
& "C:\Program Files\nodejs\node.exe" serverless\local_cost_simulator.js
```

To capture real stdout/stderr into evidence:

```powershell
cmd /c '"C:\Program Files\nodejs\node.exe" "serverless\local_cost_simulator.js" > "evidence\serverless\cost_report_run.txt" 2>&1'
```

Output: `evidence/serverless/cost_report.md`, headed
**LOCAL ESTIMATE — NOT ACTUAL AWS BILLING**, with a simulated monthly cost
breakdown, five optimization recommendations and simulated savings.

## Why this is not a real AWS deployment

`template.yaml` describes what *would* be deployed in AWS (SAM: Lambda, API
Gateway, IAM role, CloudWatch log group with 7-day retention), but this
practical performs no `sam deploy`, no AWS CLI calls and no network access.
The local runtime executes the same handler code that SAM would package, which
verifies the handler's logic, structured logging and response contract without
touching any cloud resource. Cost figures are teaching estimates only.
