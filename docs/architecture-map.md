# Mapeo y documentacion del codigo (ClinicWise)

Fecha: 2026-03-31

## Alcance
Este documento describe la arquitectura actual, rutas, APIs, modelo de datos y flujos principales. Incluye diagramas en Mermaid y PlantUML en `docs/diagrams/`.

## Stack y ejecucion
- Frontend/SSR: Next.js App Router, React 19, TypeScript
- Backend: API routes en Next.js, Prisma Client
- DB: PostgreSQL
- UI: Tailwind + Radix UI
- IA: Genkit + Google GenAI (Gemini) para sugerencias de conflicto

## Estructura de carpetas (alto nivel)
- `src/app`: rutas y layouts (App Router)
- `src/components`: UI y providers de estado
- `src/hooks`: hooks que consumen providers
- `src/lib`: utilidades, auth, prisma, tipos
- `src/ai`: flows de IA (Genkit)
- `prisma/schema.prisma`: modelo de datos
- `public/catalog`: catalogo de imagenes (avatars, logos)

## Rutas UI
- `/`: landing, redirige a `/agenda` si hay sesion (`src/app/page.tsx`)
- `/agenda`: vista de agenda general (Staff) (`src/app/agenda/page.tsx` + `agenda-client.tsx`)
- `/doctor`: vista de agenda para medicos (`src/app/doctor/page.tsx`)
- `/admin`: login y panel administrativo (`src/app/admin/page.tsx`)
- `/admin/doctors`: alta/edicion/baja de medicos
- `/admin/rooms`: gestion de consultorios
- `/admin/branding`: nombre, logo y paleta

## Providers de estado (RootLayout)
Definidos en `src/app/layout.tsx` y usados via hooks:
- `SessionProvider` -> `/api/auth/me` (sesion actual)
- `SettingsProvider` -> `/api/settings/branding` (branding)
- `RoomsProvider` -> `/api/rooms`
- `DoctorsProvider` -> `/api/doctors`
- `BookingsProvider` -> `/api/bookings` y `/api/bookings/status`

Providers adicionales:
- `AdminSettingsProvider` -> `/api/settings` (limites)
- `MediaImagesProvider` -> `/api/media/images` (catalogo de imagenes)

## API Endpoints
Auth
- `POST /api/auth/login`: login, crea cookie `clinic_session`
- `POST /api/auth/logout`: limpia cookie y sesion
- `GET /api/auth/me`: usuario actual
- `POST /api/auth/unblock`: desbloquea por rate limit (admin)

Doctors
- `GET /api/doctors`: lista doctores (admin)
- `POST /api/doctors`: crea doctor + user (admin)
- `PUT /api/doctors`: actualiza doctor + user (admin)
- `DELETE /api/doctors`: elimina doctor + user (admin)
- `GET /api/doctors/me`: perfil del doctor logueado

Rooms
- `GET /api/rooms`: lista consultorios (user)
- `POST /api/rooms`: crea consultorio (admin)
- `PUT /api/rooms`: actualiza consultorio (admin)
- `DELETE /api/rooms`: elimina consultorio (admin)

Bookings
- `GET /api/bookings`: agenda (admin ve todo, doctor solo lo propio)
- `POST /api/bookings`: crea reserva con validacion de solapes
- `POST /api/bookings/status`: actualiza estado de reserva

Settings
- `GET /api/settings`: limites (admin)
- `POST /api/settings`: actualiza limites (super admin)
- `GET /api/settings/branding`: branding publico
- `POST /api/settings/branding`: actualiza branding (admin)

Media
- `GET /api/media/images`: lista imagenes en `public/catalog` (admin)

CSV
- `POST /api/export-csv`: genera descarga CSV desde datos enviados

AI
- `POST /api/automated-conflict-resolution`: sugiere horarios alternos

## Modelo de datos (Prisma)
- `User` -> credenciales y rol
- `Doctor` -> perfil medico (1:1 con User)
- `Room` -> consultorios
- `Booking` -> reservas (Room y Doctor)
- `Session` -> tokens de sesion
- `ClinicSettings` -> singleton de limites y branding

Ver diagrama ER en `docs/diagrams/erd.mmd`.

## Flujos clave
Login
- UI envia credenciales a `/api/auth/login`
- Se valida password con bcrypt y se crea sesion
- Cookie `clinic_session` habilita acceso

Reserva
- `BookingModal` usa `BookingsProvider.addBooking`
- Doble validacion de solapes (cliente y servidor)
- Reserva se crea en DB y se actualiza el estado local

Expiracion de sesion
- `SessionTimeoutWarning` monitorea actividad y hace logout automatico
- Back-end valida caducidad e inactividad en `getSessionUser`

## IA (Genkit)
- Flow: `src/ai/flows/automated-conflict-resolution.ts`
- Usa `googleai/gemini-2.5-flash`
- Modo fallback sin `GEMINI_API_KEY`

## Diagramas
- Contexto: `docs/diagrams/system-context.mmd`
- Contenedores: `docs/diagrams/container.mmd`
- C4 Components (PlantUML): `docs/diagrams/c4-components.puml`
- Deployment (PlantUML): `docs/diagrams/deployment.puml`
- ERD: `docs/diagrams/erd.mmd`
- Secuencia login: `docs/diagrams/sequence-login.mmd`
- Secuencia reserva: `docs/diagrams/sequence-booking.mmd`
- Dataflow frontend: `docs/diagrams/frontend-dataflow.mmd`
- Mapa UI detallado (PlantUML): `docs/diagrams/ui-components.puml`
