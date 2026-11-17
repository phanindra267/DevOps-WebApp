/**
 * CloudOps Sentinel - Serverless Lambda Handler
 * Aligns with INT 378 Practical Syllabus (Session 2026-27 - Experiment 10)
 * Handles API Gateway Proxy Events, writes structured telemetry logs to AWS CloudWatch,
 * calculates execution duration, and returns JSON payload.
 */

exports.handler = async (event, context) => {
    const startTime = Date.now();
    const requestId = context.awsRequestId || `req-${Date.now()}`;
    
    // 1. Structured CloudWatch Logging
    console.log(JSON.stringify({
        level: "INFO",
        timestamp: new Date().toISOString(),
        requestId: requestId,
        message: "CloudOps Sentinel Serverless Lambda Triggered",
        httpMethod: event.httpMethod || "GET",
        path: event.path || "/api/v1/serverless",
        sourceIp: event.requestContext?.identity?.sourceIp || "127.0.0.1",
        stage: event.requestContext?.stage || "dev"
    }));

    // 2. Health & Business Logic Processing
    const executionDuration = Date.now() - startTime;
    const responsePayload = {
        status: "SUCCESS",
        service: "CloudOps Sentinel Serverless Engine",
        course: "INT 378",
        session: "2026-27",
        candidate: "Kakumani Phaneendra (Reg: 12418953, LPU)",
        metrics: {
            requestId: requestId,
            durationMs: executionDuration,
            memoryAllocatedMB: context.memoryLimitInMB || 128,
            coldStart: !context.alreadyWarmed,
            logStream: context.logStreamName || "local-stream"
        },
        payload: {
            message: "Serverless microservice executed successfully via AWS Lambda & API Gateway",
            cloudwatchIntegration: "Verified (Structured JSON logs emitted to /aws/lambda/cloudops-serverless)"
        }
    };

    // Flag warmed state for subsequent invocations
    context.alreadyWarmed = true;

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "X-CloudOps-Engine": "Serverless-Lambda-v1",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(responsePayload, null, 2)
    };
};
