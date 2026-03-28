# ClinicWise

## Catálogo de imágenes (logo y avatars)
Las imágenes disponibles en la biblioteca se leen desde `public/catalog/`.

Recomendaciones:
- Formatos: `.png`, `.jpg`, `.jpeg`, `.webp`
- Mantener nombres simples y sin espacios.
- Si agregas o cambias imágenes, recarga la app para verlas en la biblioteca.

## Licencia
MIT. Ver `LICENSE`.

## Variables de entorno
Crea un archivo `.env` en la raíz con lo siguiente (ajusta según tu entorno):

```
# Prisma / DB
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinic?schema=public"

# IA (opcional)
GEMINI_API_KEY="tu-clave"
```

## Desarrollo local
Pasos recomendados:
1. Instala dependencias: `npm install`
2. Migra la base de datos: `npm run prisma:migrate`
3. Inicia en desarrollo: `npm run dev`

## PostgreSQL local (Docker)
1. Levanta PostgreSQL: `docker compose up -d`
2. Aplica migraciones: `npm run prisma:migrate:deploy`
3. (Opcional) Regenera cliente Prisma: `npm run prisma:generate`

Para producción:
1. Define variables de entorno en tu hosting.
2. Ejecuta migraciones en el entorno de producción: `npm run prisma:migrate:deploy`
3. Construye y corre: `npm run build` y `npm run start`.
