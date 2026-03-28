param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$TaskName = "ClinicServer",
  [string]$BindHost = "0.0.0.0",
  [int]$Port = 9002,
  [switch]$Register = $true,
  [switch]$StartNow = $true,
  [switch]$StopTask = $false,
  [switch]$RemoveTask = $false
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Assert-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Ejecuta este script en PowerShell como Administrador."
  }
}

function Assert-Command([string]$CommandName, [string]$InstallHint) {
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "No se encontró '$CommandName'. $InstallHint"
  }
}

Assert-Admin
Assert-Command "npm.cmd" "Instala Node.js LTS."

if (-not (Test-Path (Join-Path $ProjectRoot ".env"))) {
  throw "No existe .env en '$ProjectRoot'."
}

if ($StopTask) {
  Write-Step "Deteniendo tarea '$TaskName'"
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}

if ($RemoveTask) {
  Write-Step "Eliminando tarea '$TaskName'"
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
}

if ($Register) {
  Write-Step "Registrando tarea '$TaskName'"
  $argument = "/c cd /d `"$ProjectRoot`" && npm.cmd run start -- -H $BindHost -p $Port"
  $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument $argument
  $trigger = New-ScheduledTaskTrigger -AtStartup
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -StartWhenAvailable

  Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Clinic Next.js server" `
    -User "$env:USERNAME" `
    -RunLevel Highest `
    -Force | Out-Null

  Write-Host "   Tarea registrada." -ForegroundColor Green
}

if ($StartNow) {
  Write-Step "Iniciando tarea '$TaskName'"
  Start-ScheduledTask -TaskName $TaskName
  Write-Host "   Tarea iniciada. Espera 5-10 segundos y prueba: http://localhost:$Port" -ForegroundColor Green
}

Write-Step "Completado"
Write-Host "Administra la tarea con:" -ForegroundColor Yellow
Write-Host "  Get-ScheduledTask -TaskName $TaskName" -ForegroundColor Yellow
Write-Host "  Stop-ScheduledTask -TaskName $TaskName" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName $TaskName" -ForegroundColor Yellow
Write-Host "  Unregister-ScheduledTask -TaskName $TaskName -Confirm:`$false" -ForegroundColor Yellow

