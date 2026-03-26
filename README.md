# ClinicWise

## Catálogo de imágenes (logo y avatars)
Las imágenes disponibles en la biblioteca se leen desde `public/catalog/`.

Recomendaciones:
- Formatos: `.png`, `.jpg`, `.jpeg`, `.webp`
- Mantener nombres simples y sin espacios.
- Si agregas o cambias imágenes, recarga la app para verlas en la biblioteca.

## Variables de entorno
Crea un archivo `.env` en la raíz con lo siguiente (ajusta según tu entorno):

```
# Prisma / DB
DATABASE_URL="file:./dev.db"

# Firebase (cliente)
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-proyecto"
NEXT_PUBLIC_FIREBASE_APP_ID="tu-app-id"
NEXT_PUBLIC_FIREBASE_API_KEY="tu-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-auth-domain"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="tu-sender-id"

# IA (opcional)
GEMINI_API_KEY="tu-clave"
```

## Despliegue
Pasos recomendados:
1. Instala dependencias: `npm install`
2. Migra la base de datos: `npx prisma migrate dev`
3. Inicia en desarrollo: `npm run dev`

Para producción:
1. Define variables de entorno en tu hosting.
2. Ejecuta migraciones en el entorno de producción.
3. Construye y corre: `npm run build` y `npm run start`.
