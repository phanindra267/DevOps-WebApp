#!/usr/bin/env node
/**
 * INT 378 - Practical 10: LOCAL ESTIMATE ONLY cost simulator.
 *
 * 100% LOCAL ONLY. No AWS pricing API, no network calls, no credentials,
 * no paid services. All rates below are HARD-CODED ILLUSTRATIVE numbers used
 * purely to demonstrate FinOps cost modelling. They are NOT actual AWS prices
 * and MUST NOT be treated as a real bill.
 *
 * Run (single command):
 *   & "C:\Program Files\nodejs\node.exe" serverless\local_cost_simulator.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const EVIDENCE_DIR = path.join(__dirname, '..', 'evidence', 'serverless');
const REPORT_FILE = path.join(EVIDENCE_DIR, 'cost_report.md');

const DAYS_PER_MONTH = 30;

/**
 * ILLUSTRATIVE RATE CARD (fabricated teaching values, not AWS pricing).
 * A real analysis would use the AWS Pricing API / Cost Explorer - intentionally
 * NOT used here because this exercise is fully offline.
 */
const RATE_CARD = Object.freeze({
  containerPerRunningHour: 0.05,      // USD / local container / running hour (illustrative)
  lambdaPerMillionRequests: 0.20,     // USD / 1M Lambda requests (illustrative)
  lambdaPerGbSecond: 0.0000166667,    // USD / GB-second (illustrative)
  apiGatewayPerMillionRequests: 3.50, // USD / 1M API Gateway requests (illustrative)
  cloudWatchIngestPerGb: 0.50,        // USD / GB ingested (illustrative)
  cloudWatchStoragePerGbMonth: 0.03,  // USD / GB-month stored (illustrative)
  dataTransferPerGb: 0.09             // USD / GB transferred out (illustrative)
});

/**
 * SAMPLE RESOURCE INVENTORY (illustrative snapshot of the local stack).
 * Container names mirror typical local services; volumes are assumed figures.
 */
const INVENTORY = {
  containers: [
    { name: 'cloudops-web', hoursPerDay: 24 },
    { name: 'cloudops-backend', hoursPerDay: 24 },
    { name: 'cloudops-postgres', hoursPerDay: 24 },
    { name: 'cloudops-redis', hoursPerDay: 24 },
    { name: 'prometheus', hoursPerDay: 24 },
    { name: 'grafana', hoursPerDay: 12 }
  ],
  lambda: {
    functionName: 'cloudops-sentinel-lambda',
    invocationsPerMonth: 1200000,
    avgDurationMs: 120,
    memoryMb: 128
  },
  apiGateway: { requestsPerMonth: 1200000 },
  cloudWatch: { ingestGbPerMonth: 3, storedGb: 6, retentionDays: 30 },
  dataTransferGbPerMonth: 5
};

/** Optimization levers applied to compute the "optimized" scenario. */
const OPTIMIZATION = {
  containerHoursPerDayAfter: 12,       // schedule non-prod containers off outside business hours
  lambdaAvgDurationMsAfter: 80,        // reuse connections / move init out of handler
  apiGatewayRequestsAfter: 960000,     // client-side caching cuts requests by 20%
  cloudWatchIngestGbAfter: 2,          // trim verbose/duplicate log lines
  cloudWatchStoredGbAfter: 1.5,        // 7-day retention instead of 30 days
  dataTransferGbAfter: 3               // enable gzip/compression
};

const money = (n) => `$${n.toFixed(2)}`;

function containerCost(containers, hoursOverride) {
  return containers.reduce((sum, c) => {
    const hoursPerDay = hoursOverride === undefined ? c.hoursPerDay : hoursOverride;
    return sum + hoursPerDay * DAYS_PER_MONTH * RATE_CARD.containerPerRunningHour;
  }, 0);
}

function lambdaCost(invocations, durationMs, memoryMb) {
  const requestCost = (invocations / 1e6) * RATE_CARD.lambdaPerMillionRequests;
  const gbSeconds = (memoryMb / 1024) * (durationMs / 1000) * invocations;
  return { requestCost, durationCost: gbSeconds * RATE_CARD.lambdaPerGbSecond, gbSeconds };
}

function apiCost(requests) {
  return (requests / 1e6) * RATE_CARD.apiGatewayPerMillionRequests;
}

function cloudWatchCost(ingestGb, storedGb) {
  return {
    ingestCost: ingestGb * RATE_CARD.cloudWatchIngestPerGb,
    storageCost: storedGb * RATE_CARD.cloudWatchStoragePerGbMonth
  };
}

function dataTransferCost(gb) {
  return gb * RATE_CARD.dataTransferPerGb;
}

function buildReport() {
  const inv = INVENTORY;
  const opt = OPTIMIZATION;

  // ---- Current scenario ----
  const currentContainers = containerCost(inv.containers);
  const currentLambda = lambdaCost(inv.lambda.invocationsPerMonth, inv.lambda.avgDurationMs, inv.lambda.memoryMb);
  const currentApi = apiCost(inv.apiGateway.requestsPerMonth);
  const currentCw = cloudWatchCost(inv.cloudWatch.ingestGbPerMonth, inv.cloudWatch.storedGb);
  const currentTransfer = dataTransferCost(inv.dataTransferGbPerMonth);
  const currentTotal =
    currentContainers + currentLambda.requestCost + currentLambda.durationCost +
    currentApi + currentCw.ingestCost + currentCw.storageCost + currentTransfer;

  // ---- Optimized scenario ----
  const optimizedContainers = containerCost(inv.containers, opt.containerHoursPerDayAfter);
  const optimizedLambda = lambdaCost(inv.lambda.invocationsPerMonth, opt.lambdaAvgDurationMsAfter, inv.lambda.memoryMb);
  const optimizedApi = apiCost(opt.apiGatewayRequestsAfter);
  const optimizedCw = cloudWatchCost(opt.cloudWatchIngestGbAfter, opt.cloudWatchStoredGbAfter);
  const optimizedTransfer = dataTransferCost(opt.dataTransferGbAfter);
  const optimizedTotal =
    optimizedContainers + optimizedLambda.requestCost + optimizedLambda.durationCost +
    optimizedApi + optimizedCw.ingestCost + optimizedCw.storageCost + optimizedTransfer;

  const totalSavings = currentTotal - optimizedTotal;
  const savingsPct = currentTotal > 0 ? (totalSavings / currentTotal) * 100 : 0;

  const containerSavings = currentContainers - optimizedContainers;
  const lambdaDurationSavings = currentLambda.durationCost - optimizedLambda.durationCost;
  const apiSavings = currentApi - optimizedApi;
  // Lambda request cost also drops with fewer API Gateway requests.
  const lambdaRequestSavings = currentLambda.requestCost -
    (opt.apiGatewayRequestsAfter / 1e6) * RATE_CARD.lambdaPerMillionRequests;
  const cwSavings = (currentCw.ingestCost + currentCw.storageCost) -
    (optimizedCw.ingestCost + optimizedCw.storageCost);
  const transferSavings = currentTransfer - optimizedTransfer;

  const generatedAt = new Date().toISOString();

  const lines = [];
  lines.push('# LOCAL ESTIMATE — NOT ACTUAL AWS BILLING');
  lines.push('');
  lines.push('> **LOCAL ESTIMATE — NOT ACTUAL AWS BILLING.** This report is produced by a');
  lines.push('> fully offline teaching simulator. Every rate is a hard-coded illustrative');
  lines.push('> value, every quantity is an assumed input. No AWS Pricing API, Cost Explorer,');
  lines.push('> credentials, network call or paid service was used. Do not use these numbers');
  lines.push('> to forecast or reconcile a real cloud invoice.');
  lines.push('');
  lines.push(`_Generated locally: ${generatedAt}_`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 1. Methodology');
  lines.push('');
  lines.push('Monthly cost = quantity × illustrative rate. Containers are costed by assumed');
  lines.push('running hours; Lambda by request count plus GB-seconds; API Gateway by request');
  lines.push('count; CloudWatch by ingest and stored GB; data transfer by GB out.');
  lines.push('');
  lines.push('### Illustrative rate card (hard-coded, NOT AWS prices)');
  lines.push('');
  lines.push('| Resource | Illustrative rate |');
  lines.push('| --- | --- |');
  lines.push(`| Local container (running hour) | ${money(RATE_CARD.containerPerRunningHour)} / hour |`);
  lines.push(`| Lambda requests | ${money(RATE_CARD.lambdaPerMillionRequests)} / 1M requests |`);
  lines.push(`| Lambda duration | $${RATE_CARD.lambdaPerGbSecond} / GB-second |`);
  lines.push(`| API Gateway requests | ${money(RATE_CARD.apiGatewayPerMillionRequests)} / 1M requests |`);
  lines.push(`| CloudWatch Logs ingest | ${money(RATE_CARD.cloudWatchIngestPerGb)} / GB |`);
  lines.push(`| CloudWatch Logs storage | ${money(RATE_CARD.cloudWatchStoragePerGbMonth)} / GB-month |`);
  lines.push(`| Data transfer out | ${money(RATE_CARD.dataTransferPerGb)} / GB |`);
  lines.push('');
  lines.push('### Assumed resource inventory (input, not measured)');
  lines.push('');
  lines.push('| Local container | Assumed hours/day |');
  lines.push('| --- | --- |');
  for (const c of inv.containers) {
    lines.push(`| ${c.name} | ${c.hoursPerDay} |`);
  }
  lines.push('');
  lines.push(`- Lambda \`${inv.lambda.functionName}\`: ${inv.lambda.invocationsPerMonth.toLocaleString('en-US')} invocations/month, ` +
    `${inv.lambda.avgDurationMs} ms avg duration, ${inv.lambda.memoryMb} MB memory.`);
  lines.push(`- API Gateway: ${inv.apiGateway.requestsPerMonth.toLocaleString('en-US')} requests/month.`);
  lines.push(`- CloudWatch Logs: ${inv.cloudWatch.ingestGbPerMonth} GB ingested/month, ` +
    `${inv.cloudWatch.storedGb} GB stored, ${inv.cloudWatch.retentionDays}-day retention.`);
  lines.push(`- Data transfer: ${inv.dataTransferGbPerMonth} GB/month.`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 2. Simulated monthly cost — current scenario');
  lines.push('');
  lines.push('| Line item | Simulated monthly cost (USD) |');
  lines.push('| --- | --- |');
  lines.push(`| Containers (${inv.containers.length} local containers) | ${money(currentContainers)} |`);
  lines.push(`| Lambda — requests | ${money(currentLambda.requestCost)} |`);
  lines.push(`| Lambda — duration (${currentLambda.gbSeconds.toFixed(1)} GB-s) | ${money(currentLambda.durationCost)} |`);
  lines.push(`| API Gateway — requests | ${money(currentApi)} |`);
  lines.push(`| CloudWatch Logs — ingest | ${money(currentCw.ingestCost)} |`);
  lines.push(`| CloudWatch Logs — storage | ${money(currentCw.storageCost)} |`);
  lines.push(`| Data transfer out | ${money(currentTransfer)} |`);
  lines.push(`| **TOTAL (current, estimated)** | **${money(currentTotal)}** |`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 3. Optimization recommendations & simulated savings');
  lines.push('');
  lines.push('| # | Recommendation | Simulated monthly saving |');
  lines.push('| --- | --- | --- |');
  lines.push(`| 1 | Schedule non-prod local containers off outside business hours (24h -> ${opt.containerHoursPerDayAfter}h/day) | ${money(containerSavings)} |`);
  lines.push(`| 2 | Reduce Lambda duration ${inv.lambda.avgDurationMs} ms -> ${opt.lambdaAvgDurationMsAfter} ms (connection reuse, init outside handler) | ${money(lambdaDurationSavings)} |`);
  lines.push(`| 3 | Client-side caching: API Gateway ${inv.apiGateway.requestsPerMonth.toLocaleString('en-US')} -> ${opt.apiGatewayRequestsAfter.toLocaleString('en-US')} requests/month | ${money(apiSavings + lambdaRequestSavings)} |`);
  lines.push(`| 4 | Trim verbose logs and cut CloudWatch retention ${inv.cloudWatch.retentionDays} -> 7 days | ${money(cwSavings)} |`);
  lines.push(`| 5 | Enable payload compression to cut transfer ${inv.dataTransferGbPerMonth} -> ${opt.dataTransferGbAfter} GB | ${money(transferSavings)} |`);
  lines.push('');
  lines.push('### Optimized scenario summary');
  lines.push('');
  lines.push('| Line item | Simulated monthly cost (USD) |');
  lines.push('| --- | --- |');
  lines.push(`| Containers | ${money(optimizedContainers)} |`);
  lines.push(`| Lambda — requests | ${money(optimizedLambda.requestCost)} |`);
  lines.push(`| Lambda — duration | ${money(optimizedLambda.durationCost)} |`);
  lines.push(`| API Gateway — requests | ${money(optimizedApi)} |`);
  lines.push(`| CloudWatch Logs — ingest + storage | ${money(optimizedCw.ingestCost + optimizedCw.storageCost)} |`);
  lines.push(`| Data transfer out | ${money(optimizedTransfer)} |`);
  lines.push(`| **TOTAL (optimized, estimated)** | **${money(optimizedTotal)}** |`);
  lines.push('');
  lines.push(`**Simulated total savings: ${money(totalSavings)} / month (${savingsPct.toFixed(1)}% reduction).**`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 4. Disclaimer');
  lines.push('');
  lines.push('**LOCAL ESTIMATE — NOT ACTUAL AWS BILLING.** Nothing in this report came from');
  lines.push('an AWS account, a billing API, or a live resource. The container names are local');
  lines.push('Docker service names, not billed AWS resources. All rates and quantities are');
  lines.push('illustrative teaching inputs. For a real FinOps exercise, replace the rate card');
  lines.push('and inventory with data from AWS Cost Explorer / the AWS Pricing API.');
  lines.push('');

  return {
    report: lines.join('\n') + '\n',
    currentTotal,
    optimizedTotal,
    totalSavings,
    savingsPct,
    lineCount: lines.length
  };
}

function main() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const result = buildReport();
  fs.writeFileSync(REPORT_FILE, result.report, 'utf8');

  console.log('============================================================');
  console.log('INT 378 Practical 10 - LOCAL Cost Simulator');
  console.log('LOCAL ESTIMATE - NOT ACTUAL AWS BILLING (offline, illustrative rates).');
  console.log('============================================================');
  console.log(`Simulated monthly cost (current):   ${money(result.currentTotal)}`);
  console.log(`Simulated monthly cost (optimized): ${money(result.optimizedTotal)}`);
  console.log(`Simulated savings:                  ${money(result.totalSavings)} (${result.savingsPct.toFixed(1)}%)`);
  console.log(`Report written to: ${REPORT_FILE}`);
  console.log(`Report lines: ${result.lineCount}`);
  console.log('No network calls, no AWS APIs, no credentials were used.');
}

main();
