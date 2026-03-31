# Instalacion Local Como Servidor (Windows)

## 1. Requisitos
- Windows 10/11.
- Node.js LTS instalado (incluye `npm`).
- Permisos de administrador (para tarea programada y firewall).
- Puerto disponible (por defecto: `9002`).

## 2. Que Archivos Llevar Al Equipo Destino
Copiar la carpeta del proyecto incluyendo:
- `src/`
- `public/`
- `prisma/` (incluyendo `migrations/`)
- `scripts/`
- `.env`
- `package.json`
- `package-lock.json`
- `next.config.ts`, `tsconfig.json`, etc.

No copiar:
- `node_modules/`
- `.next/`
- `.pm2/`
- logs temporales

## 3. Preparacion Inicial (PowerShell normal)
Desde la carpeta del proyecto:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-local-server.ps1 -BindHost 0.0.0.0 -Port 9002 -UsePM2:$false -OpenFirewall:$false
```

Este paso:
- instala dependencias
- genera cliente Prisma
- aplica migraciones
- compila la aplicacion

## 4. Registrar Inicio Automatico (PowerShell Administrador)
En la carpeta del proyecto:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-local-server-task.ps1 -TaskName ClinicServer -BindHost 0.0.0.0 -Port 9002
```

Esto registra la tarea de Windows y la inicia.

## 5. Verificacion
```powershell
Get-ScheduledTask -TaskName ClinicServer
Get-ScheduledTaskInfo -TaskName ClinicServer
npm run check:settings
```

Probar en navegador:
- Local: `http://localhost:9002`
- Red local: `http://<IP_DEL_SERVIDOR>:9002`

## 6. Operacion Diaria
Iniciar:
```powershell
Start-ScheduledTask -TaskName ClinicServer
```

Detener:
```powershell
Stop-ScheduledTask -TaskName ClinicServer
```

Reiniciar:
```powershell
Stop-ScheduledTask -TaskName ClinicServer
Start-ScheduledTask -TaskName ClinicServer
```

## 7. Actualizar Codigo En Produccion Local
Cuando haya cambios:

```powershell
cd C:\ruta\al\proyecto
npm run build
Stop-ScheduledTask -TaskName ClinicServer
Start-ScheduledTask -TaskName ClinicServer
```

Si hubo cambios de base de datos:

```powershell
npm run prisma:migrate:deploy
npm run build
Stop-ScheduledTask -TaskName ClinicServer
Start-ScheduledTask -TaskName ClinicServer
```

## 8. Firewall (opcional, Administrador)
Abrir puerto:
```powershell
New-NetFirewallRule -DisplayName "Clinic Server 9002" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 9002
```

Cerrar puerto:
```powershell
Remove-NetFirewallRule -DisplayName "Clinic Server 9002"
```

## 9. Baja Del Servidor
Paro temporal:
```powershell
Stop-ScheduledTask -TaskName ClinicServer
```

Eliminar instalacion programada:
```powershell
Stop-ScheduledTask -TaskName ClinicServer
Unregister-ScheduledTask -TaskName ClinicServer -Confirm:$false
```

## 10. Scripts Disponibles
- Preparacion del servidor:
  - `scripts/setup-local-server.ps1`
- Registro en Task Scheduler:
  - `scripts/setup-local-server-task.ps1`
- Revisar configuracion guardada:
  - `npm run check:settings`

## 11. Fechas y zonas horarias
La base de datos usa `timestamptz` (UTC). Esto permite convertir la hora al mostrarla según la zona del usuario/clinica.
Si ves horas distintas a tu local, es esperado. La UI debe convertir desde UTC a la zona correspondiente.
