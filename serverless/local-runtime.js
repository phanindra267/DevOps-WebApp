#!/usr/bin/env node
/**
 * INT 378 - Practical 10: LOCAL Lambda / API Gateway simulator.
 *
 * 100% LOCAL ONLY. No AWS SDK, no credentials, no network calls, no paid services.
 * This file loads the real Lambda handler (serverless/lambda/index.js) and invokes
 * it in-process with a synthetic API Gateway proxy event, while emulating the
 * pieces of the AWS runtime that the handler relies on (context object, warm
 * execution environment, CloudWatch-style console capture).
 *
 * Run (single command):
 *   & "C:\Program Files\nodejs\node.exe" serverless\local-runtime.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HANDLER_PATH = path.join(__dirname, 'lambda', 'index.js');
const EVIDENCE_DIR = path.join(__dirname, '..', 'evidence', 'serverless');
const LOG_FILE = path.join(EVIDENCE_DIR, 'cloudwatch_logs.txt');

const LOG_GROUP = '/aws/lambda/cloudops-sentinel-lambda';
const LOG_STREAM = '2026/11/17/[$LATEST]local-sim-stream';
const FUNCTION_NAME = 'cloudops-sentinel-lambda';

// Load the ACTUAL handler that is deployed by template.yaml (CodeUri ./lambda/, Handler index.handler).
const handlerModule = require(HANDLER_PATH);
if (typeof handlerModule.handler !== 'function') {
  throw new Error('serverless/lambda/index.js did not export a handler function');
}
const handler = handlerModule.handler;

/** Build a synthetic Amazon API Gateway "proxy" event (GET/POST style). */
function makeApiGatewayEvent({ requestId, method, route, sourceIp, body }) {
  return {
    resource: route,
    path: route,
    httpMethod: method,
    headers: {
      'Content-Type': 'application/json',
      'X-Amzn-Trace-Id': `Root=1-${requestId}`,
      'User-Agent': 'local-runtime/1.0 (INT 378 Practical 10)'
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {
      requestId: requestId,
      stage: 'dev',
      resourcePath: route,
      httpMethod: method,
      path: `/dev${route}`,
      protocol: 'HTTP/1.1',
      identity: {
        sourceIp: sourceIp,
        userAgent: 'local-runtime/1.0'
      }
    },
    body: body || null,
    isBase64Encoded: false
  };
}

/** Emulate the Lambda `context` object passed to the handler. */
function makeContext(requestId) {
  return {
    awsRequestId: requestId,
    memoryLimitInMB: 128,
    logStreamName: LOG_STREAM,
    logGroupName: LOG_GROUP,
    functionName: FUNCTION_NAME,
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:local:000000000000:function:cloudops-sentinel-lambda',
    getRemainingTimeInMillis: () => 10000,
    callbackWaitsForEmptyEventLoop: true
    // NOTE: `alreadyWarmed` is deliberately absent on the first invocation and
    // carried over manually on later ones to emulate a reused execution environment.
  };
}

/**
 * Invoke the handler while temporarily intercepting console.log so that the
 * handler's structured JSON telemetry is captured as CloudWatch-style log lines.
 */
async function invoke(event, context) {
  const captured = [];
  const originalLog = console.log;
  console.log = (...args) => {
    const line = args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ');
    captured.push(line);
  };

  const startNs = process.hrtime.bigint();
  let response = null;
  let error = null;
  try {
    response = await handler(event, context);
  } catch (err) {
    error = err;
  } finally {
    console.log = originalLog; // always restore, even if the handler throws
  }
  const durationMs = Number(process.hrtime.bigint() - startNs) / 1e6;
  return { response, error, captured, durationMs };
}

function timestamp() {
  return new Date().toISOString();
}

async function main() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  // Three invocations demonstrate a cold start followed by warm starts.
  const scenarios = [
    {
      label: 'GET /health (first invocation -> COLD start)',
      event: makeApiGatewayEvent({
        requestId: 'local-req-0001',
        method: 'GET',
        route: '/health',
        sourceIp: '203.0.113.10'
      })
    },
    {
      label: 'POST /process (reused environment -> WARM start)',
      event: makeApiGatewayEvent({
        requestId: 'local-req-0002',
        method: 'POST',
        route: '/process',
        sourceIp: '203.0.113.11',
        body: JSON.stringify({ action: 'health-check', course: 'INT 378' })
      })
    },
    {
      label: 'GET /health (reused environment -> WARM start)',
      event: makeApiGatewayEvent({
        requestId: 'local-req-0003',
        method: 'GET',
        route: '/health',
        sourceIp: '203.0.113.12'
      })
    }
  ];

  const logLines = [
    '# LOCAL SIMULATION - CloudWatch-style log stream (NOT real AWS CloudWatch)',
    `# Log group: ${LOG_GROUP}`,
    `# Log stream: ${LOG_STREAM}`,
    `# Function: ${FUNCTION_NAME} (handler: index.handler)`,
    ''
  ];

  let warmed = false; // emulated execution-environment reuse across invocations
  let passCount = 0;

  console.log('============================================================');
  console.log('INT 378 Practical 10 - LOCAL Lambda / API Gateway Simulator');
  console.log('100% LOCAL: no AWS, no credentials, no network calls.');
  console.log('============================================================');

  for (let i = 0; i < scenarios.length; i += 1) {
    const scenario = scenarios[i];
    const requestId = scenario.event.requestContext.requestId;

    // New context per request (unique awsRequestId), but carry the warm flag to
    // emulate a Lambda execution environment that stays alive between calls.
    const context = makeContext(requestId);
    if (warmed) context.alreadyWarmed = true;

    const { response, error, captured, durationMs } = await invoke(scenario.event, context);
    warmed = context.alreadyWarmed === true;

    const status = response && response.statusCode;
    // Derive the start type from the handler's own reported metric in the RESPONSE
    // body (the CloudWatch log line does not contain this field).
    let coldStartFlag = false;
    if (response && response.body) {
      try {
        const parsedBody = JSON.parse(response.body);
        coldStartFlag = !!(parsedBody.metrics && parsedBody.metrics.coldStart === true);
      } catch (_) {
        coldStartFlag = false;
      }
    }
    const startType = coldStartFlag ? 'COLD' : 'WARM';

    console.log('');
    console.log(`--- Invocation #${i + 1}: ${scenario.label} ---`);
    console.log(`RequestId: ${requestId}`);

    const ts = timestamp();
    logLines.push(`${ts}\t${requestId}\tINFO\tSTART RequestId: ${requestId} Version: $LATEST`);

    for (const line of captured) {
      logLines.push(`${ts}\t${requestId}\tINFO\t${line}`);
    }

    if (error) {
      console.error(`Invocation error: ${error && error.stack ? error.stack : error}`);
      logLines.push(`${ts}\t${requestId}\tERROR\t${error && error.message ? error.message : String(error)}`);
    } else {
      console.log(`Status code: ${status}`);
      console.log('Body:');
      console.log(response.body);
      console.log(`Duration: ${durationMs.toFixed(2)} ms | Start type: ${startType}`);

      if (status === 200) passCount += 1;
    }

    logLines.push(`${ts}\t${requestId}\tINFO\tEND RequestId: ${requestId}`);
    logLines.push(
      `${ts}\t${requestId}\tREPORT\tRequestId: ${requestId}\tDuration: ${durationMs.toFixed(2)} ms` +
        `\tBilled Duration: ${Math.ceil(durationMs)} ms\tMemory Size: 128 MB` +
        `\tMax Memory Used: ~64 MB (simulated)\tInit Duration: ${startType === 'COLD' ? 'simulated' : '0.00 ms (warm)'}`
    );
    logLines.push('');
  }

  fs.writeFileSync(LOG_FILE, logLines.join('\n') + '\n', 'utf8');

  const allOk = passCount === scenarios.length;
  console.log('');
  console.log('============================================================');
  console.log(
    `Summary: ${passCount}/${scenarios.length} invocations returned HTTP 200 ` +
      `(${allOk ? 'PASS' : 'FAIL'})`
  );
  console.log(`CloudWatch-style logs written to: ${LOG_FILE}`);
  console.log('NOTE: These are simulated logs, not real AWS CloudWatch events.');
  console.log('============================================================');

  if (!allOk) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Local runtime failed:', err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
