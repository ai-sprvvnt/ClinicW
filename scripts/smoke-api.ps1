param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$BindHost = "127.0.0.1",
  [int]$Port = 9010,
  [int]$StartupWaitSeconds = 8
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

function Invoke-NodeScript([string]$Script, [string[]]$NodeArgs = @()) {
  $tmpJs = Join-Path $ProjectRoot ("tmp-smoke-" + [Guid]::NewGuid().ToString("N") + ".js")
  try {
    Set-Content -Path $tmpJs -Value $Script -Encoding utf8
    $out = & node $tmpJs @NodeArgs
    if ($LASTEXITCODE -ne 0) {
      throw "Falló script Node inline."
    }
    return ($out | Out-String).Trim()
  } finally {
    if (Test-Path $tmpJs) {
      Remove-Item $tmpJs -Force -ErrorAction SilentlyContinue
    }
  }
}

Push-Location $ProjectRoot
try {
  Write-Step "Validando entorno"
  Assert-Command "npm.cmd" "Instala Node.js LTS."
  Assert-Command "node" "Instala Node.js LTS."

  $baseUrl = "http://$BindHost`:$Port"
  $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $smokeAdminEmail = "smoke.admin.$timestamp@local.test"
  $smokeAdminPassword = "Smoke!$timestamp"
  $sessionToken = $null
  $serverProcess = $null

  $tmpStdout = Join-Path $ProjectRoot "tmp-smoke-out.log"
  $tmpStderr = Join-Path $ProjectRoot "tmp-smoke-err.log"
  if (Test-Path $tmpStdout) { Remove-Item $tmpStdout -Force }
  if (Test-Path $tmpStderr) { Remove-Item $tmpStderr -Force }

  Write-Step "Creando admin de smoke"
  & npm.cmd run create-admin -- $smokeAdminEmail $smokeAdminPassword super
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear el admin de smoke."
  }

  Write-Step "Creando sesión de smoke en PostgreSQL"
  $sessionToken = Invoke-NodeScript @'
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = process.argv[2];
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('No existe usuario admin de smoke');
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(now + 24 * 60 * 60 * 1000),
        lastActiveAt: new Date(now),
      },
    });
    process.stdout.write(token);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
'@ @($smokeAdminEmail)

  Write-Step "Iniciando app en modo producción"
  $serverProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm.cmd run start -- -H $BindHost -p $Port" `
    -WorkingDirectory $ProjectRoot `
    -PassThru `
    -RedirectStandardOutput $tmpStdout `
    -RedirectStandardError $tmpStderr

  Start-Sleep -Seconds $StartupWaitSeconds

  Write-Step "Ejecutando smoke test de endpoints"
  $smokeResult = Invoke-NodeScript @'
const baseUrl = process.argv[2];
const token = process.argv[3];
const smokeAdminEmail = process.argv[4];
const smokeAdminPassword = process.argv[5];

const headers = {
  'content-type': 'application/json',
  cookie: 'clinic_session=' + token,
};

async function call(method, path, body, auth = true) {
  const requestHeaders = auth ? headers : { 'content-type': 'application/json' };
  const res = await fetch(baseUrl + path, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

(async () => {
  let roomId = null;
  let doctorId = null;
  let bookingId = null;
  const out = [];
  try {
    const login = await call('POST', '/api/auth/login', { email: smokeAdminEmail, password: smokeAdminPassword }, false);
    if (login.status !== 200 || !login.data?.success) throw new Error('POST /api/auth/login falló');
    out.push('POST /api/auth/login => OK');

    const me = await call('GET', '/api/auth/me');
    if (me.status !== 200 || me.data?.user?.role !== 'ADMIN') throw new Error('GET /api/auth/me falló');
    out.push('GET /api/auth/me => OK');

    const settingsPost = await call('POST', '/api/settings', { maxRooms: 100, maxDoctors: 100 });
    if (settingsPost.status !== 200 || !settingsPost.data?.settings) throw new Error('POST /api/settings falló');
    out.push('POST /api/settings => OK');

    const settingsGet = await call('GET', '/api/settings');
    if (settingsGet.status !== 200 || !settingsGet.data?.settings) throw new Error('GET /api/settings falló');
    out.push('GET /api/settings => OK');

    const suffix = Date.now();
    const roomName = 'Smoke Room ' + suffix;
    const doctorEmail = 'smoke.doctor.' + suffix + '@local.test';
    const doctorPass = 'Doc!' + suffix;

    const roomPost = await call('POST', '/api/rooms', { name: roomName, roomType: 'General' });
    roomId = roomPost.data?.room?.id ?? null;
    if (roomPost.status !== 200 || !roomId) throw new Error('POST /api/rooms falló');
    out.push('POST /api/rooms => OK (' + roomId + ')');

    const roomsGet = await call('GET', '/api/rooms');
    if (roomsGet.status !== 200 || !Array.isArray(roomsGet.data?.rooms)) throw new Error('GET /api/rooms falló');
    out.push('GET /api/rooms => OK');

    const doctorPost = await call('POST', '/api/doctors', {
      email: doctorEmail,
      displayName: 'Smoke Doctor',
      specialty: 'General',
      password: doctorPass,
      avatarUrl: null,
    });
    doctorId = doctorPost.data?.doctor?.id ?? null;
    if (doctorPost.status !== 200 || !doctorId) throw new Error('POST /api/doctors falló');
    out.push('POST /api/doctors => OK (' + doctorId + ')');

    const doctorsGet = await call('GET', '/api/doctors');
    if (doctorsGet.status !== 200 || !Array.isArray(doctorsGet.data?.doctors)) throw new Error('GET /api/doctors falló');
    out.push('GET /api/doctors => OK');

    const bookingPost = await call('POST', '/api/bookings', {
      roomId,
      doctorId,
      dateKey: '2026-01-10',
      startMin: 600,
      endMin: 660,
      startAt: '2026-01-10T10:00:00.000Z',
      endAt: '2026-01-10T11:00:00.000Z',
    });
    bookingId = bookingPost.data?.booking?.id ?? null;
    if (bookingPost.status !== 200 || !bookingId) throw new Error('POST /api/bookings falló');
    out.push('POST /api/bookings => OK (' + bookingId + ')');

    const bookingsGet = await call('GET', '/api/bookings');
    if (bookingsGet.status !== 200 || !Array.isArray(bookingsGet.data?.bookings)) throw new Error('GET /api/bookings falló');
    out.push('GET /api/bookings => OK');

    const statusPost = await call('POST', '/api/bookings/status', { bookingId, status: 'cancelled' });
    if (statusPost.status !== 200 || statusPost.data?.booking?.status !== 'cancelled') throw new Error('POST /api/bookings/status falló');
    out.push('POST /api/bookings/status => OK');

    const doctorDelete = await call('DELETE', '/api/doctors', { id: doctorId });
    if (doctorDelete.status !== 200 || !doctorDelete.data?.success) throw new Error('DELETE /api/doctors falló');
    doctorId = null;
    out.push('DELETE /api/doctors => OK');

    const roomDelete = await call('DELETE', '/api/rooms', { id: roomId });
    if (roomDelete.status !== 200 || !roomDelete.data?.success) throw new Error('DELETE /api/rooms falló');
    roomId = null;
    out.push('DELETE /api/rooms => OK');

    const logout = await call('POST', '/api/auth/logout');
    if (logout.status !== 200 || !logout.data?.success) throw new Error('POST /api/auth/logout falló');
    out.push('POST /api/auth/logout => OK');

    process.stdout.write(out.join('\n'));
  } finally {
    if (bookingId) {
      await call('POST', '/api/bookings/status', { bookingId, status: 'cancelled' }).catch(() => {});
    }
    if (doctorId) {
      await call('DELETE', '/api/doctors', { id: doctorId }).catch(() => {});
    }
    if (roomId) {
      await call('DELETE', '/api/rooms', { id: roomId }).catch(() => {});
    }
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
'@ @($baseUrl, $sessionToken, $smokeAdminEmail, $smokeAdminPassword)

  Write-Step "Resultado"
  $smokeResult -split "`r?`n" | ForEach-Object {
    if ($_.Trim().Length -gt 0) {
      Write-Host "  - $_" -ForegroundColor Green
    }
  }
}
finally {
  Write-Step "Limpieza"

  try {
    if ($serverProcess -and -not $serverProcess.HasExited) {
      Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {}

  try {
    if (Test-Path $tmpStdout) { Remove-Item $tmpStdout -Force -ErrorAction SilentlyContinue }
    if (Test-Path $tmpStderr) { Remove-Item $tmpStderr -Force -ErrorAction SilentlyContinue }
  } catch {}

  try {
    if ($smokeAdminEmail) {
      Invoke-NodeScript @'
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = process.argv[2];
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
'@ @($smokeAdminEmail) | Out-Null
    }
  } catch {
    Write-Host "No se pudo limpiar el usuario de smoke automáticamente. Revisa DB." -ForegroundColor Yellow
  }

  Pop-Location
}
