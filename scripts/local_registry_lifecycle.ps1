# ==============================================================================
# SCRIPT: LOCAL DOCKER REGISTRY IMAGE LIFECYCLE (INT 378 - Practical 4)
# ------------------------------------------------------------------------------
# Reproducible, 100% LOCAL tag -> push -> remove -> pull -> run -> catalog flow
# using the in-host `registry:2` container exposed on localhost:5000.
#
# NO AWS, NO credentials, NO external registry pushes. Docker treats
# `localhost:5000` as an insecure registry by default, so plain HTTP works.
#
# PRECONDITION (start the registry once):
#   docker compose -f docker-compose.registry.yml up -d
#   curl.exe http://localhost:5000/v2/        # -> 200 {}
#
# USAGE:
#   powershell -ExecutionPolicy Bypass -File .\scripts\local_registry_lifecycle.ps1
#   # capture evidence:
#   powershell -ExecutionPolicy Bypass -File .\scripts\local_registry_lifecycle.ps1 `
#       2>&1 | Tee-Object -FilePath .\evidence\registry\registry_lifecycle.txt
#
# Aligned with: scripts\docker_hub_lifecycle.ps1 (the Docker Hub analogue).
# Candidate: Kakumani Phaneendra (Reg: 12418953, LPU)
# ==============================================================================

param(
    [string]$Registry   = "localhost:5000",
    [string]$DemoRepo   = "cloudops-demo",
    [string]$DemoTag    = "local",
    [string]$BaseImage  = "alpine:latest",
    [switch]$IncludeBackend  # when set, also push the project's int378-backend image
)

$ErrorActionPreference = "Continue"

function Write-Banner([string]$Text) {
    Write-Output ""
    Write-Output "=============================================================="
    Write-Output " $Text"
    Write-Output "=============================================================="
}

function Write-Step([string]$Text) {
    Write-Output ""
    Write-Output "----- $Text -----"
}

# Executes a native command, echoes the exact command line, prints all of its
# real (combined stdout+stderr) output, and reports the OS exit code.
function Invoke-Logged {
    param(
        [Parameter(Mandatory=$true)][string]$Exe,
        [string[]]$Args = @()
    )
    $display = "$Exe" + $(if ($Args.Count -gt 0) { " " + ($Args -join " ") } else { "" })
    Write-Output "> $display"
    if ($Args.Count -gt 0) {
        $raw = & $Exe @Args 2>&1
    } else {
        $raw = & $Exe 2>&1
    }
    $code = $LASTEXITCODE
    foreach ($item in $raw) {
        if ($item -is [System.Management.Automation.ErrorRecord]) {
            Write-Output $item.Exception.Message
        } else {
            Write-Output $item.ToString()
        }
    }
    Write-Output "[exit=$code]"
}

$DemoRef  = "${Registry}/${DemoRepo}:${DemoTag}"
$BackendRef = "${Registry}/int378-backend:local"

Write-Banner "LOCAL DOCKER REGISTRY LIFECYCLE (INT 378 - Practical 4)"
Write-Output "Registry endpoint : http://${Registry}/"
Write-Output "Demo image ref    : ${DemoRef}"
Write-Output "Base image        : ${BaseImage}"
Write-Output "Timestamp         : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"
Write-Output "Host / OS         : $env:COMPUTERNAME / $([System.Environment]::OSVersion.VersionString)"

# --------------------------------------------------------------- Stage 0
Write-Step "STAGE 0 - Preflight: registry health + catalog"
Invoke-Logged -Exe "docker" -Args @("ps", "--filter", "name=cloudops-local-registry", "--format", "{{.Names}} | {{.Status}} | {{.Ports}}")
Invoke-Logged -Exe "curl.exe" -Args @("-sS", "-i", "http://${Registry}/v2/")
Invoke-Logged -Exe "curl.exe" -Args @("-sS", "http://${Registry}/v2/_catalog")

# --------------------------------------------------------------- Stage 1
Write-Step "STAGE 1 - Tag small cached image for the local registry"
Invoke-Logged -Exe "docker" -Args @("tag", $BaseImage, $DemoRef)
Invoke-Logged -Exe "docker" -Args @("images", $DemoRef, "--format", "{{.Repository}}:{{.Tag}} {{.ID}} {{.Size}}")

# --------------------------------------------------------------- Stage 2
Write-Step "STAGE 2 - Push image to LOCAL registry (ECR Push analogue)"
Invoke-Logged -Exe "docker" -Args @("push", $DemoRef)

# --------------------------------------------------------------- Stage 3
Write-Step "STAGE 3 - Verify catalog immediately after push"
Invoke-Logged -Exe "curl.exe" -Args @("-sS", "http://${Registry}/v2/_catalog")

# --------------------------------------------------------------- Stage 4
Write-Step "STAGE 4 - Remove the local tag (simulate a clean client / ECR Pull test)"
Invoke-Logged -Exe "docker" -Args @("rmi", $DemoRef)
Invoke-Logged -Exe "docker" -Args @("images", $DemoRef)

# --------------------------------------------------------------- Stage 5
Write-Step "STAGE 5 - Pull the image back FROM the LOCAL registry"
Invoke-Logged -Exe "docker" -Args @("pull", $DemoRef)

# --------------------------------------------------------------- Stage 6
Write-Step "STAGE 6 - Run the pulled image (proof the round-trip works)"
Invoke-Logged -Exe "docker" -Args @("run", "--rm", $DemoRef, "echo", "Hello from the LOCAL registry at ${Registry}")

# --------------------------------------------------------------- Stage 7
Write-Step "STAGE 7 - Final catalog (manifest stored in registry_data volume)"
Invoke-Logged -Exe "curl.exe" -Args @("-sS", "http://${Registry}/v2/_catalog")

# --------------------------------------------------------------- Stage 8
if ($IncludeBackend) {
    Write-Step "STAGE 8 - Push the project backend image (ECR production analogue)"
    Invoke-Logged -Exe "docker" -Args @("images", "int378-backend:latest", "--format", "{{.Repository}}:{{.Tag}} {{.ID}} {{.Size}}")
    Invoke-Logged -Exe "docker" -Args @("tag", "int378-backend:latest", $BackendRef)
    Invoke-Logged -Exe "docker" -Args @("push", $BackendRef)
    Invoke-Logged -Exe "curl.exe" -Args @("-sS", "http://${Registry}/v2/_catalog")
}

Write-Banner "LIFECYCLE COMPLETE - registry container left RUNNING on port 5000"
Write-Output "Stop later with: docker compose -f docker-compose.registry.yml down"
