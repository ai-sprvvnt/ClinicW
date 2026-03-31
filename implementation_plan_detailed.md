# Plan Tecnico Detallado - Expansion de Staff Clinico

Este documento define el plan tecnico completo para expandir la informacion del personal clinico (doctores, internos y servicio social). Incluye alcance, cambios por capa, validaciones y pruebas por hitos.

## Contexto Actual (Repo)
- BD: Prisma con Postgres (ver `prisma/schema.prisma`).
- Modelo principal: `Doctor`.
- API: `src/app/api/doctors/route.ts`, `src/app/api/doctors/me/route.ts`.
- UI Admin: `src/app/admin/doctors/page.tsx`.
- Tipos compartidos: `src/lib/types.ts`.
- Acceso: `GET /api/doctors` usa `requireUser` (no admin).

## Decisiones de Negocio (Bloqueantes)
1. Catalogo `staffType` (confirmado):
   - Profesional
   - Practicas Profesionales
   - Servicio Social
   - Personal Interno
2. `license` (cedula) obligatoria solo para `Profesional`.
3. `license` es unique en BD.
4. Privacidad: campos visibles solo para Administradores por ahora.

## Hito 0 - Definiciones y Alcance
Objetivo: cerrar reglas de negocio antes de tocar schema.

Tareas:
1. Confirmar valores exactos de `staffType`:
   - Profesional
   - Practicas Profesionales
   - Servicio Social
2. Definir campos requeridos:
   - Profesional: `license` requerido
   - Otros: `license` opcional
3. Confirmar si `degree`, `career`, `roleDescription` son opcionales.
4. Definir visibilidad:
   - Solo admin o tambien usuarios autenticados.

Verificacion:
1. Checklist de reglas aprobada por negocio.

## Hito 1 - Base de Datos (Schema + Migracion)
Objetivo: agregar campos al modelo `Doctor`.

Cambios:
1. `prisma/schema.prisma`:
   - Agregar `enum StaffType`.
   - Agregar campos:
     - `degree String?`
     - `license String?` (opcionalmente `@unique`)
     - `career String?`
     - `roleDescription String?`
     - `staffType StaffType @default(Profesional)`
2. Migracion Prisma:
   - En este entorno, `prisma migrate dev` es no interactivo.
   - Generar SQL con `prisma migrate diff` y crear carpeta en `prisma/migrations/`.
   - Luego aplicar migracion en terminal interactiva local o con `prisma migrate deploy` en el destino.
   - Verificar defaults para registros existentes.

Validacion:
1. `prisma migrate dev` sin errores.
2. Confirmar que registros existentes reciben `staffType` default.

## Hito 2 - API (Validaciones + Payloads)
Objetivo: aceptar y validar los nuevos campos.

Archivos:
- `src/app/api/doctors/route.ts`
- `src/app/api/doctors/me/route.ts`

Cambios:
1. POST/PUT:
   - Aceptar `degree`, `license`, `career`, `roleDescription`, `staffType`.
   - Validar `staffType` contra enum.
   - Validar `license` requerido si `staffType === Profesional`.
   - Sanitizar entradas (`trim`).
2. GET:
   - Si los campos son sensibles, cambiar a `requireAdmin()` o filtrar.

Validacion:
1. POST profesional sin `license` -> 400.
2. POST practicas/servicio sin `license` -> OK.
3. PUT actualiza campos correctamente.

## Hito 3 - UI Admin (Formulario + Listado)
Objetivo: agregar campos en el admin.

Archivo:
- `src/app/admin/doctors/page.tsx`

Cambios:
1. Formulario nuevo:
   - Inputs `degree`, `license`, `career`, `roleDescription`.
   - Select `staffType`.
   - Validacion en UI: `license` requerido para `Profesional`.
2. Tabla:
   - Columna `staffType`.
   - Opcional: indicador de `license` (por ejemplo "Con cedula").
3. Modal de edicion:
   - Soportar todos los nuevos campos.
4. Encoding:
   - Corregir textos con encoding roto a UTF-8.

Validacion:
1. Crear y editar registros con cada `staffType`.
2. Verificar que la tabla muestra `staffType`.

## Hito 4 - Tipos y Providers
Objetivo: mantener consistencia de tipos compartidos y estados.

Archivos:
- `src/lib/types.ts`
- `src/components/doctors-provider.tsx`

Cambios:
1. Agregar nuevos campos a `Doctor` interface.
2. Actualizar mapping en provider para incluirlos.

Validacion:
1. UI admin no rompe al refrescar.

## Hito 5 - Pruebas
Objetivo: validacion completa por capa.

Automatizadas:
1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`

Manuales:
1. Crear Profesional con `license` y `degree`.
2. Crear Practicas Profesionales sin `license`.
3. Editar Profesional y agregar `career`.
4. Confirmar que no se exponen datos sensibles a usuarios no admin (si aplica).

## Hito 6 - Deploy y Rollback
Objetivo: deploy seguro de cambios y plan de salida.

Deploy:
1. `prisma migrate deploy` en ambiente destino.
2. Validar endpoints y UI post-deploy.

Rollback:
1. Revertir migracion si hay fallos.
2. Hotfix para permitir `license` nullable si bloquea operaciones.

## Checklist de Archivos a Tocar
- `prisma/schema.prisma`
- `prisma/migrations/*`
- `src/app/api/doctors/route.ts`
- `src/app/api/doctors/me/route.ts`
- `src/app/admin/doctors/page.tsx`
- `src/lib/types.ts`
- `src/components/doctors-provider.tsx`

## Checklist Ejecutable (Por Hito)
### Hito 0 - Definiciones
1. Confirmar valores exactos de `staffType`.
2. Confirmar obligatoriedad de `license` por tipo.
3. Confirmar si `license` es unique.
4. Confirmar visibilidad (admin vs usuarios autenticados).

### Hito 1 - BD
1. Editar `prisma/schema.prisma` con enum y nuevos campos.
2. Ejecutar `prisma migrate dev` y revisar SQL.
3. Verificar defaults para registros existentes.

### Hito 2 - API
1. Extender POST/PUT en `src/app/api/doctors/route.ts`.
2. Validar `staffType` y reglas de `license`.
3. Ajustar GET para privacidad (filtrar o requireAdmin).
4. Probar endpoints con casos de cada tipo.

### Hito 3 - UI Admin
1. Agregar campos al formulario en `src/app/admin/doctors/page.tsx`.
2. Agregar select `staffType`.
3. Agregar columnas a tabla.
4. Actualizar modal de edición.
5. Validar UX y mensajes.

### Hito 4 - Tipos/Providers
1. Actualizar `Doctor` en `src/lib/types.ts`.
2. Ajustar mapping en `src/components/doctors-provider.tsx`.

### Hito 5 - Pruebas
1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. Pruebas manuales (crear/editar por tipo).

### Hito 6 - Deploy/Rollback
1. `prisma migrate deploy` en ambiente destino.
2. Verificar API/UI en producción.
3. Plan de rollback definido.
