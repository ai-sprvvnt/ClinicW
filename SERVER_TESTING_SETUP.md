# Levantamiento Del Servidor Para Pruebas (Windows)

## Objetivo
Levantar la aplicacion en un equipo Windows como servidor de pruebas, accesible:
- localmente (`localhost`)
- en red local (LAN) desde otros equipos

Este documento cubre configuracion, scripts, ubicaciones, verificacion y solucion de problemas.

## Ubicacion Del Proyecto
- Ruta esperada del proyecto:
  - `C:\Users\Felipe García\projects\clinic`

## Scripts Disponibles
- Preparacion del servidor (instalacion, migraciones, build):
  - `scripts/setup-local-server.ps1`
- Registro de inicio automatico con Task Scheduler:
  - `scripts/setup-local-server-task.ps1`
- Verificacion de settings en base de datos:
  - `scripts/check-settings.js`

## Requisitos
- Windows 10/11
- Node.js LTS instalado (`node`, `npm`)
- PowerShell
- PostgreSQL disponible en `localhost:5432` (o ajustar `DATABASE_URL`)
- Permisos de administrador para:
  - registrar tarea programada
  - abrir puerto en firewall (opcional)

## Variables Importantes
- Archivo:
  - `.env`
- Variable clave:
  - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinic?schema=public"`

## Puerto Y Host Recomendados
- Host: `0.0.0.0`
- Puerto: `9002`

## Flujo Recomendado (Primera Vez)

### 1) Preparar aplicacion (PowerShell normal)
```powershell
cd "C:\Users\Felipe García\projects\clinic"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-local-server.ps1 -BindHost 0.0.0.0 -Port 9002 -UsePM2:$false -OpenFirewall:$false
```

Este paso realiza:
- `npm install`
- `prisma generate`
- `prisma migrate deploy`
- `next build`

### 2) Registrar inicio automatico (PowerShell Administrador)
```powershell
cd "C:\Users\Felipe García\projects\clinic"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-local-server-task.ps1 -TaskName ClinicServer -BindHost 0.0.0.0 -Port 9002
```

Esto crea la tarea de Windows `ClinicServer` y la inicia.

## Verificacion Rapida

### Estado de tarea
```powershell
Get-ScheduledTask -TaskName ClinicServer
Get-ScheduledTaskInfo -TaskName ClinicServer
```

### Validar configuracion guardada en DB
```powershell
npm run check:settings
```

### Probar URL
- En servidor:
  - `http://localhost:9002`
- En otro equipo de la misma red:
  - `http://<IP_DEL_SERVIDOR>:9002`

Para obtener IP del servidor:
```powershell
ipconfig
```

## Operacion Diaria

### Iniciar servidor
```powershell
Start-ScheduledTask -TaskName ClinicServer
```

### Detener servidor
```powershell
Stop-ScheduledTask -TaskName ClinicServer
```

### Reiniciar servidor
```powershell
Stop-ScheduledTask -TaskName ClinicServer
Start-ScheduledTask -TaskName ClinicServer
```

## Aplicar Cambios De Codigo
Cuando hagas cambios en codigo:
```powershell
cd "C:\Users\Felipe García\projects\clinic"
npm run build
Stop-ScheduledTask -TaskName ClinicServer
Start-ScheduledTask -TaskName ClinicServer
```

Si hubo cambios de esquema de base de datos:
```powershell
cd "C:\Users\Felipe García\projects\clinic"
npm run prisma:migrate:deploy
npm run build
Stop-ScheduledTask -TaskName ClinicServer
Start-ScheduledTask -TaskName ClinicServer
```

## Configuracion De Firewall (Opcional)
Ejecutar en PowerShell Administrador.

### Abrir puerto 9002
```powershell
New-NetFirewallRule -DisplayName "Clinic Server 9002" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 9002
```

### Eliminar regla
```powershell
Remove-NetFirewallRule -DisplayName "Clinic Server 9002"
```

## Baja Del Servidor

### Paro temporal
```powershell
Stop-ScheduledTask -TaskName ClinicServer
```

### Eliminacion completa
```powershell
Stop-ScheduledTask -TaskName ClinicServer
Unregister-ScheduledTask -TaskName ClinicServer -Confirm:$false
```

## Empaquetado Para Otro Equipo
Incluir:
- `src/`, `public/`, `prisma/`, `scripts/`
- `package.json`, `package-lock.json`
- `.env`
- configuraciones (`next.config.ts`, `tsconfig.json`, etc.)

No incluir:
- `node_modules/`
- `.next/`
- `.pm2/`
- logs temporales

## Troubleshooting

### Error: script no firmado (`ExecutionPolicy`)
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Error de build por `NODE_ENV=production next build`
En este proyecto ya se corrigio a `next build` en `package.json`.

### Tarea existe pero no levanta app
1. Ver estado:
```powershell
Get-ScheduledTaskInfo -TaskName ClinicServer
```
2. Reiniciar:
```powershell
Stop-ScheduledTask -TaskName ClinicServer
Start-ScheduledTask -TaskName ClinicServer
```
3. Confirmar que `npm run build` fue ejecutado tras los ultimos cambios.

### Cambios no reflejados
Siempre reconstruir y reiniciar tarea:
```powershell
npm run build
Stop-ScheduledTask -TaskName ClinicServer
Start-ScheduledTask -TaskName ClinicServer
```

### Limites de medicos/consultorios aparentemente vacios
Verificar valor real en DB:
```powershell
npm run check:settings
```
