param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$AppName = "clinic",
  [string]$BindHost = "0.0.0.0",
  [int]$Port = 9002,
  [switch]$UsePM2 = $true,
  [switch]$OpenFirewall = $true
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Assert-Command([string]$CommandName, [string]$InstallHint) {
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "No se encontró '$CommandName'. $InstallHint"
  }
}

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Invoke-Npm([string]$Arguments) {
  $full = "npm.cmd $Arguments"
  Write-Host "   $full" -ForegroundColor DarkGray
  & npm.cmd $Arguments.Split(" ")
  if ($LASTEXITCODE -ne 0) {
    throw "Falló: $full"
  }
}

function Assert-Pm2Writable {
  $pm2Dir = $env:PM2_HOME
  if (-not $pm2Dir) {
    $pm2Dir = Join-Path $env:USERPROFILE ".pm2"
  }
  if (-not (Test-Path $pm2Dir)) {
    New-Item -ItemType Directory -Path $pm2Dir -Force | Out-Null
  }
  $probe = Join-Path $pm2Dir ".write_test"
  try {
    Set-Content -Path $probe -Value "ok" -Encoding ascii -Force
    Remove-Item $probe -Force -ErrorAction SilentlyContinue
  } catch {
    throw "No hay permisos de escritura en '$pm2Dir'. Repara permisos o elimina esa carpeta y vuelve a ejecutar."
  }
}

Push-Location $ProjectRoot
try {
  Write-Step "Validando entorno"
  Assert-Command "node" "Instala Node.js LTS."
  Assert-Command "npm.cmd" "Instala Node.js LTS (incluye npm)."

  if (-not (Test-Path ".env")) {
    throw "No existe .env en $ProjectRoot. Crea ese archivo antes de continuar."
  }

  Write-Step "Instalando dependencias"
  Invoke-Npm "install"

  Write-Step "Sincronizando Prisma Client"
  Invoke-Npm "run prisma:generate"

  Write-Step "Aplicando migraciones en la base de datos"
  Invoke-Npm "exec prisma migrate deploy"

  Write-Step "Compilando aplicación Next.js"
  Invoke-Npm "run build"

  if ($OpenFirewall) {
    Write-Step "Configurando regla de firewall para puerto $Port"
    if (-not (Test-IsAdministrator)) {
      Write-Host "   Sin privilegios de administrador. Omitiendo firewall." -ForegroundColor Yellow
      Write-Host "   Ejecuta como admin o crea la regla manualmente para el puerto $Port." -ForegroundColor Yellow
    } else {
      $ruleName = "Clinic Server $Port"
      $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
      if (-not $existingRule) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port | Out-Null
        Write-Host "   Regla creada: $ruleName" -ForegroundColor Green
      } else {
        Write-Host "   Regla ya existente: $ruleName" -ForegroundColor Yellow
      }
    }
  }

  if ($UsePM2) {
    Write-Step "Configurando ejecución persistente con PM2"
    $env:PM2_HOME = Join-Path $ProjectRoot ".pm2"
    if (-not (Test-Path $env:PM2_HOME)) {
      New-Item -ItemType Directory -Path $env:PM2_HOME -Force | Out-Null
    }
    if (-not (Get-Command "pm2.cmd" -ErrorAction SilentlyContinue)) {
      Write-Host "   PM2 no encontrado. Instalando globalmente..." -ForegroundColor Yellow
      Invoke-Npm "install -g pm2"
    }

    Assert-Pm2Writable

    $ecosystemPath = Join-Path $ProjectRoot "ecosystem.config.js"
    $ecosystem = @"
module.exports = {
  apps: [
    {
      name: "$AppName",
      cwd: "$($ProjectRoot -replace '\\','\\\\')",
      script: "npm.cmd",
      args: "run start -- -H $BindHost -p $Port",
      windowsHide: true
    }
  ]
};
"@
    Set-Content -Path $ecosystemPath -Value $ecosystem -Encoding utf8

    cmd /c "pm2.cmd delete .pm2-ecosystem >nul 2>&1"
    cmd /c "pm2.cmd delete $AppName >nul 2>&1"
    cmd /c "pm2.cmd start `"$ecosystemPath`" --only $AppName --update-env"
    if ($LASTEXITCODE -ne 0) {
      throw "No se pudo iniciar PM2 para la app '$AppName'."
    }

    $describe = cmd /c "pm2.cmd describe $AppName"
    if ($LASTEXITCODE -ne 0 -or ($describe -notmatch "status\s+online")) {
      throw "PM2 no dejó '$AppName' en estado online. Revisa: pm2.cmd logs $AppName"
    }

    cmd /c "pm2.cmd save"
    Write-Host "   App '$AppName' iniciada con PM2 en http://$BindHost`:$Port" -ForegroundColor Green
    Write-Host "   Sugerido (una vez, como admin): pm2.cmd startup" -ForegroundColor Yellow
  } else {
    Write-Step "Iniciando servidor en primer plano"
    Write-Host "   Presiona Ctrl+C para detener." -ForegroundColor Yellow
    & npm.cmd run start -- -H $BindHost -p $Port
  }

  Write-Step "Completado"
  Write-Host "Prueba desde otra PC: http://<IP_DEL_SERVIDOR>:$Port" -ForegroundColor Green
}
finally {
  Pop-Location
}
