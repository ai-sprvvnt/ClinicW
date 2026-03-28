# Smoke Test API (PostgreSQL)

## Objetivo
Validar rápidamente que, después de cambios (por ejemplo migración a PostgreSQL), los endpoints críticos siguen funcionando:
- `GET/POST` de auth/settings
- `GET/POST/DELETE` de rooms/doctors
- `GET/POST` de bookings
- `POST` de actualización de estado de booking

El script también valida inserts/updates reales y limpia datos temporales al terminar.

## Script
- `scripts/smoke-api.ps1`

## Requisitos
- Proyecto ya compilado (`npm run build`).
- PostgreSQL arriba y accesible por `DATABASE_URL`.
- Dependencias instaladas (`npm install`).
- PowerShell con permiso para ejecutar scripts en sesión actual:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Ejecución rápida
Desde la raíz del proyecto:

```powershell
.\scripts\smoke-api.ps1
```

## Parámetros opcionales
```powershell
.\scripts\smoke-api.ps1 -BindHost 127.0.0.1 -Port 9010 -StartupWaitSeconds 10
```

## Qué hace internamente
1. Crea un admin temporal `smoke.admin.*`.
2. Crea sesión temporal en DB para autenticación por cookie.
3. Levanta `next start` temporalmente en el puerto indicado.
4. Ejecuta requests a endpoints críticos.
5. Crea y borra entidades temporales (`room`, `doctor`, `booking`).
6. Cierra servidor y limpia usuario/sesiones temporales.

## Resultado esperado
Ver líneas `=> OK` para todos los endpoints probados, por ejemplo:

```text
POST /api/auth/login => OK
GET /api/auth/me => OK
POST /api/settings => OK
GET /api/settings => OK
POST /api/rooms => OK (...)
GET /api/rooms => OK
POST /api/doctors => OK (...)
GET /api/doctors => OK
POST /api/bookings => OK (...)
GET /api/bookings => OK
POST /api/bookings/status => OK
DELETE /api/doctors => OK
DELETE /api/rooms => OK
POST /api/auth/logout => OK
```

## Si falla
- Revisa primero conexión DB:
  - `npm run prisma:migrate:deploy`
- Verifica app compilada:
  - `npm run build`
- Reintenta con más espera de arranque:
  - `.\scripts\smoke-api.ps1 -StartupWaitSeconds 15`
