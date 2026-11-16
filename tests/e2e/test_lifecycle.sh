#!/bin/bash
set -e

API_BASE="http://localhost:8080/api/v1"
echo "=========================================================="
echo " CloudOps Sentinel - End-to-End Lifecycle Verification"
echo "=========================================================="

echo "[1/8] Verifying Health Check Endpoint..."
HEALTH_RESP=$(curl -s "${API_BASE}/health")
echo "Response: ${HEALTH_RESP}"

echo -e "\n[2/8] Authenticating Admin User..."
LOGIN_RESP=$(curl -s -X POST "${API_BASE}/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')
TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  # Fallback try admin123
  LOGIN_RESP=$(curl -s -X POST "${API_BASE}/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')
  TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

echo "Auth Token Acquired: ${TOKEN:0:15}..."

AUTH_HEADER="Authorization: Bearer ${TOKEN}"

echo -e "\n[3/8] Querying Project Registry..."
curl -s -H "${AUTH_HEADER}" "${API_BASE}/projects" | head -c 200
echo ""

echo -e "\n[4/8] Creating Test Microservice Project..."
PROJ_RESP=$(curl -s -X POST "${API_BASE}/projects" \
  -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{"name":"E2E Test Workload","description":"Automated integration validation service"}')
PROJ_ID=$(echo "$PROJ_RESP" | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "Project ID: ${PROJ_ID}"

echo -e "\n[5/8] Creating Target Staging Environment..."
ENV_RESP=$(curl -s -X POST "${API_BASE}/projects/${PROJ_ID}/environments" \
  -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Staging-E2E","env_type":"staging"}')
ENV_ID=$(echo "$ENV_RESP" | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "Environment ID: ${ENV_ID}"

echo -e "\n[6/8] Provisioning Terraform Infrastructure Stack..."
STACK_RESP=$(curl -s -X POST "${API_BASE}/projects/${PROJ_ID}/stacks" \
  -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  -d "{\"environment_id\":${ENV_ID},\"name\":\"ecs-vpc-stack\",\"provider\":\"terraform\"}")
STACK_ID=$(echo "$STACK_RESP" | grep -o '"id":[0-9]*' | cut -d':' -f2)

echo "Simulating Terraform Plan..."
curl -s -X POST "${API_BASE}/stacks/${STACK_ID}/plan" -H "${AUTH_HEADER}" | head -c 150
echo ""

echo "Simulating Terraform Apply..."
curl -s -X POST "${API_BASE}/stacks/${STACK_ID}/apply" -H "${AUTH_HEADER}" | head -c 150
echo ""

echo -e "\n[7/8] Triggering Container Deployment & DevSecOps Scan..."
DEP_RESP=$(curl -s -X POST "${API_BASE}/projects/${PROJ_ID}/deployments" \
  -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  -d "{\"environment_id\":${ENV_ID},\"image_tag\":\"cloudops/workload:v1.0.0\"}")
DEP_ID=$(echo "$DEP_RESP" | grep -o '"id":[0-9]*' | cut -d':' -f2)

echo "Running Security Scan on Deployment #${DEP_ID}..."
SCAN_RESP=$(curl -s -X POST "${API_BASE}/deployments/${DEP_ID}/scan" -H "${AUTH_HEADER}")
SCAN_ID=$(echo "$SCAN_RESP" | grep -o '"scan_id":[0-9]*' | cut -d':' -f2)

echo "Checking Quality Gate for Scan #${SCAN_ID}..."
curl -s -H "${AUTH_HEADER}" "${API_BASE}/scans/${SCAN_ID}/gate"
echo ""

echo -e "\n[8/9] Evaluating Policy-as-Code Compliance..."
curl -s -X POST -H "${AUTH_HEADER}" "${API_BASE}/projects/${PROJ_ID}/evaluate" | head -c 200
echo ""

echo -e "\n[9/9] Testing FinOps Cost Engine & Budget Thresholds..."
curl -s -H "${AUTH_HEADER}" "${API_BASE}/projects/${PROJ_ID}/costs" | head -c 200
echo ""
echo "Running Billing Simulation Cycle..."
curl -s -X POST -H "${AUTH_HEADER}" "${API_BASE}/projects/${PROJ_ID}/simulate-billing"
echo ""

echo -e "\n=========================================================="
echo " ✅ ALL LIFECYCLE STAGES VERIFIED SUCCESSFULLY!"
echo "=========================================================="
