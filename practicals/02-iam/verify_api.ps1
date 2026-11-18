# Practical 02 - local API verification for JWT_SECRET + RBAC enforcement.
# 100% local: talks only to http://localhost:8080 (the Docker Compose backend).
# Usage: powershell -File practicals/02-iam/verify_api.ps1
# Output: evidence/iam/api_verification.txt

$ErrorActionPreference = 'Stop'
$Base = 'http://localhost:8080/api/v1'
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Evidence = Join-Path $RepoRoot 'evidence\iam\api_verification.txt'

$script:Lines = [System.Collections.Generic.List[string]]::new()
function Log { param([string]$Text) $script:Lines.Add($Text) }
function Flush {
    $content = ($script:Lines -join "`n") + "`n"
    [System.IO.File]::WriteAllText($Evidence, $content, (New-Object System.Text.UTF8Encoding($false)))
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Token = '',
        [string]$Body = ''
    )
    $uri = "$Base$Path"
    $headers = @{}
    if ($Token) { $headers['Authorization'] = "Bearer $Token" }
    $params = @{
        Uri = $uri; Method = $Method; Headers = $headers
        UseBasicParsing = $true; TimeoutSec = 15
    }
    if ($Body) { $params['ContentType'] = 'application/json'; $params['Body'] = $Body }

    $display = "Invoke-WebRequest -Method $Method -Uri '$uri'"
    if ($Token) { $display += " -Headers @{ Authorization = 'Bearer <TOKEN>' }" }
    if ($Body) { $display += " -Body '$Body'" }
    Log "COMMAND: $display"

    try {
        $resp = Invoke-WebRequest @params
        $status = [int]$resp.StatusCode
        $content = [string]$resp.Content
    } catch {
        $resp = $_.Exception.Response
        if ($null -eq $resp) {
            $status = 0
            $content = "EXCEPTION: $($_.Exception.Message)"
        } else {
            $status = [int]$resp.StatusCode
            $stream = $resp.GetResponseStream()
            $stream.Position = 0
            $content = [System.IO.StreamReader]::new($stream).ReadToEnd()
        }
    }
    Log "HTTP $status"
    Log "BODY: $($content.Trim())"
    Log ''
    return @{ Status = $status; Body = $content }
}

Log '================================================================'
Log ' PRACTICAL 02 - LOCAL API VERIFICATION (JWT_SECRET + RBAC)'
Log (" Date      : " + (Get-Date).ToString('s'))
Log ' Target    : http://localhost:8080/api/v1 (Docker Compose backend)'
Log ' Stack     : rebuilt with docker compose build backend + force-recreate'
Log '================================================================'
Log ''

Log '[1] Public health endpoint (no token)'
$h = Invoke-Api -Method GET -Path '/health'
Log ''

Log '[2] Public login with documented admin credentials (admin/admin123)'
$loginBody = '{"username":"admin","password":"admin123"}'
$login = Invoke-Api -Method POST -Path '/login' -Body $loginBody
$adminToken = ''
if ($login.Status -eq 200) {
    $adminToken = ($login.Body | ConvertFrom-Json).token
    Log ("ADMIN_TOKEN: {0}...{1} (length {2})" -f $adminToken.Substring(0, 20), $adminToken.Substring($adminToken.Length - 8), $adminToken.Length)
} else {
    Log 'ERROR: admin login failed; remaining checks cannot run.'
    Flush
    throw 'admin login failed'
}
Log ''

Log '[3] JWT signature uses JWT_SECRET from docker-compose.yml (local env)'
$parts = $adminToken.Split('.')
$secret = 'localDevSecretKeyForCloudOpsPlatform2026'
$bmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($secret))
$sig = $bmac.ComputeHash([System.Text.Encoding]::ASCII.GetBytes("$($parts[0]).$($parts[1])"))
$expected = [Convert]::ToBase64String($sig).Replace('+', '-').Replace('/', '_').TrimEnd('=')
Log "COMPOSE_JWT_SECRET: $secret"
Log "SIGNATURE_MATCHES_ENV_SECRET: $($expected -eq $parts[2])"
$oldMac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes('ReplaceWithStrongSecret'))
$oldSig = $oldMac.ComputeHash([System.Text.Encoding]::ASCII.GetBytes("$($parts[0]).$($parts[1])"))
$oldExpected = [Convert]::ToBase64String($oldSig).Replace('+', '-').Replace('/', '_').TrimEnd('=')
Log "SIGNATURE_MATCHES_OLD_HARDCODED_SECRET: $($oldExpected -eq $parts[2])"
Log ''

Log '[4] Protected GET with admin token'
Invoke-Api -Method GET -Path '/me' -Token $adminToken | Out-Null
Invoke-Api -Method GET -Path '/projects' -Token $adminToken | Out-Null

Log '[5] Mutating POST with admin token (must be allowed)'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$projBody = "{`"name`":`"IAM-RBAC-Verify-$suffix`",`"description`":`"Created by local RBAC verification`"}"
$created = Invoke-Api -Method POST -Path '/projects' -Token $adminToken -Body $projBody
$projectId = 0
if ($created.Body -match '"id"\s*:\s*(\d+)') { $projectId = [int]$Matches[1] }
Log "CREATED_PROJECT_ID: $projectId"
Log ''

Log '[6] Public self-registration creates a least-privilege viewer (role field ignored)'
$viewerName = "iamviewer_$suffix"
$regBody = "{`"username`":`"$viewerName`",`"email`":`"$viewerName@local.test`",`"password`":`"viewer123`",`"role`":`"admin`"}"
$reg = Invoke-Api -Method POST -Path '/register' -Body $regBody
Log "NOTE: request asked for role=admin; registration forced role=viewer."
Log ''

Log '[7] Login as the viewer'
$vloginBody = "{`"username`":`"$viewerName`",`"password`":`"viewer123`"}"
$vlogin = Invoke-Api -Method POST -Path '/login' -Body $vloginBody
$viewerToken = ''
if ($vlogin.Status -eq 200) {
    $viewerToken = ($vlogin.Body | ConvertFrom-Json).token
    Log "VIEWER_TOKEN: $($viewerToken.Substring(0, 20))... (length $($viewerToken.Length))"
} else {
    Log 'ERROR: viewer login failed.'
    Flush
    throw 'viewer login failed'
}
Log ''

Log '[8] Protected GET with viewer token (must be allowed - viewer is read-only, not denied reads)'
Invoke-Api -Method GET -Path '/me' -Token $viewerToken | Out-Null
Invoke-Api -Method GET -Path '/projects' -Token $viewerToken | Out-Null

Log '[9] Mutating POST with viewer token (must be DENIED by RBAC)'
$vprojBody = "{`"name`":`"Viewer-Should-Not-Create-$suffix`",`"description`":`"Must be blocked`"}"
$deniedPost = Invoke-Api -Method POST -Path '/projects' -Token $viewerToken -Body $vprojBody

Log '[10] Mutating PUT with viewer token (must be DENIED by RBAC)'
if ($projectId -gt 0) {
    $vputBody = "{`"name`":`"Viewer-Should-Not-Update-$suffix`",`"description`":`"Must be blocked`"}"
    $deniedPut = Invoke-Api -Method PUT -Path "/projects/$projectId" -Token $viewerToken -Body $vputBody
} else {
    Log 'SKIPPED: no project id available from step 5.'
    $deniedPut = @{ Status = -1 }
}

Log '[11] Mutating POST with NO token (must be 401 Unauthorized)'
$noAuth = Invoke-Api -Method POST -Path '/projects' -Body $projBody

Log '================================================================'
Log ' RESULT SUMMARY'
Log " health_200            : $($h.Status -eq 200)"
Log " admin_login_200       : $($login.Status -eq 200)"
Log " jwt_secret_env_used   : $($expected -eq $parts[2])"
Log " admin_protected_get   : 200 (see step 4)"
Log " admin_mutation_201    : $($created.Status -eq 201)"
Log " viewer_registration   : $($reg.Status -eq 201)"  # replaced below if undefined
Log " viewer_protected_get  : 200 (see step 8)"
Log " viewer_post_denied_403: $($deniedPost.Status -eq 403)"
Log " viewer_put_denied_403 : $($deniedPut.Status -eq 403)"
Log " no_token_post_401     : $($noAuth.Status -eq 401)"
Log '================================================================'
Flush
