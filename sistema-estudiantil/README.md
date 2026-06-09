# Sistema Estudiantil

Guía para colaboradores: instalación, dependencias y configuración de PostgreSQL.

## Arquitectura del Proyecto

Este proyecto usa **Next.js 16 con App Router**, donde el frontend y backend viven en la misma aplicación con una estructura clara:

### ¿Por qué una sola carpeta y no separadas?

#### ✅ **Next.js fue diseñado así**
Next.js integra frontend y backend nativamente. El `app/` directory maneja automáticamente:
- Rutas de página (`/app/dashboard/usuarios/page.tsx` → `GET /dashboard/usuarios`)
- API routes (`/app/api/usuarios/route.ts` → `POST /api/usuarios`)
- Middleware para autenticación

Separar sería trabajar *contra* el framework, no *con* él.

#### ✅ **Menos complejidad**
- Una sola instalación de dependencias (`npm install`)
- Un solo build (`npm run build`)
- Un solo servidor (`npm start`)
- Sin sincronización entre dos aplicaciones distintas
- Sin problemas de CORS entre frontend y backend

#### ✅ **Fácil de mantener**
- Los endpoints API están junto a los componentes que los usan
- Cambiar una página y su API es tarea en un mismo lugar
- Versionado más simple (un `git commit` para frontend + backend)
- Refactoring más fácil (mover archivos sin quebrar referencias)

#### ✅ **Seguro sin separación**
- Las variables de entorno `AUTH_SECRET` no se exponen al cliente
- Las credenciales de BD están solo en el servidor
- La validación Zod ocurre en el servidor antes de tocar la BD
- Next.js aplica automáticamente CORS correcto para APIs internas

### Estructura del Proyecto

```
app/
├── (auth)/                    # Rutas de autenticación
│   └── login/
│       └── page.tsx
├── dashboard/                 # Rutas protegidas del dashboard
│   ├── usuarios/
│   │   └── page.tsx          # UI
│   ├── estudiantes/
│   ├── profesores/
│   ├── materias/
│   ├── notas/
│   ├── estudiante/
│   ├── familia/
│   └── layout.tsx
├── components/
│   └── dashboard/
│       └── ImportUsuariosModal.tsx
├── api/
│   ├── usuarios/             # Backend API
│   │   ├── route.ts          # GET, POST
│   │   ├── [id]/
│   │   │   └── route.ts      # PATCH, DELETE
│   │   └── importar/
│   │       └── route.ts      # POST (carga masiva)
│   ├── estudiantes/
│   ├── profesores/
│   ├── notas/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts
│   └── ...
├── globals.css
└── layout.tsx                # Root layout

lib/
├── prisma.ts                 # Cliente Prisma
├── validators/
│   └── userImport.ts         # Zod schemas
└── utils/

prisma/
├── schema.prisma
├── seed.ts
└── migrations/

public/
```

**Regla de oro:**
- Si es página → `app/dashboard/...` o un grupo como `app/(auth)/...`
- Si es API → `app/api/...`
- Si es componente reutilizable → `app/components/...`
- Si es lógica compartida → `lib/`

## Requisitos previos

- Node.js 22.x o superior
- npm 10.x o superior
- PostgreSQL 14/15/16 instalado y corriendo localmente
- Git

## Estructura importante

- `app/` → interfaz y rutas de Next.js
- `app/api/usuarios/importar/route.ts` → endpoint para carga masiva de usuarios
- `app/components/dashboard/ImportUsuariosModal.tsx` → modal de importación CSV
- `lib/validators/userImport.ts` → validación Zod de importación
- `prisma/schema.prisma` → modelo de datos

## Configuración rápida del proyecto

1. Clonar el repositorio:

```bash
git clone <tu-repositorio> && cd sistema-estudiantil
```

2. Copiar el archivo de ejemplo de variables de entorno:

```bash
cp .env.example .env
```

3. Ajustar `.env` si es necesario:

- `DATABASE_URL`: URL de conexión a PostgreSQL
- `AUTH_SECRET`: clave secreta para Auth.js/NextAuth
- `SEED_ADMIN_EMAIL`: correo del administrador inicial
- `SEED_ADMIN_PASSWORD`: contraseña inicial del administrador. Debe tener al menos 12 caracteres
- `GEMINI_API_KEY`: opcional, solo si usas la funcionalidad de IA en notas

## Base de datos PostgreSQL

El proyecto utiliza PostgreSQL. El nombre recomendado para la base de datos es:

```text
sistemaestudiantil
```

### Comandos para crear la base de datos

Usa estos comandos en tu terminal. No reutilices la contraseña del ejemplo en producción:

```bash
sudo -u postgres createdb sistemaestudiantil
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'cambia-esta-clave-local';"
```

Si tu instalación no usa `sudo` o tienes otro usuario, puedes ejecutar:

```bash
psql -U postgres -c "CREATE DATABASE sistemaestudiantil;"
```

### URL de ejemplo para `.env`

```env
DATABASE_URL="postgresql://postgres:cambia-esta-clave-local@localhost:5432/sistemaestudiantil?schema=public"
AUTH_SECRET="resultado-de-openssl-rand-base64-32"
SEED_ADMIN_EMAIL="admin@sistema.com"
SEED_ADMIN_PASSWORD="cambia-por-una-clave-segura"
GEMINI_API_KEY="tu_gemini_api_key_aqui"
```

Puedes generar `AUTH_SECRET` con:

```bash
openssl rand -base64 32
```

## Instalar dependencias

```bash
npm install
```

## Generar cliente Prisma y aplicar esquema

Ejecuta el setup completo:

```bash
npm run db:setup
```

También puedes ejecutar cada paso por separado:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

> Si prefieres aplicar las migraciones existentes del repositorio, usa:
>
> ```bash
> npx prisma migrate deploy
> ```

## Cargar datos iniciales (seed)

El seed crea o actualiza el usuario administrador definido en `.env`:

```bash
SEED_ADMIN_EMAIL="admin@sistema.com"
SEED_ADMIN_PASSWORD="cambia-por-una-clave-segura"
```

## Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Luego abre en el navegador:

```text
http://localhost:3000
```

> Si el puerto 3000 ya está ocupado, Next.js usará otro puerto disponible y lo mostrará en consola.
>
> ```bash
> npx next dev --hostname localhost --port 3001
> ```

## Flujo de carga masiva de usuarios

El administrador puede importar usuarios desde CSV usando la ruta:

```text
POST /api/usuarios/importar
```

La interfaz está en:

- `app/dashboard/usuarios/page.tsx`
- `app/components/dashboard/ImportUsuariosModal.tsx`

## Qué debe tener el CSV de importación

Columnas recomendadas:

- `name`
- `email`
- `role`
- `phone`
- `career`
- `cycle`
- `studentCode`
- `parentEmail`

## Comprobar instalación

Después de arrancar el proyecto, revisa que la página `/dashboard/usuarios` cargue y que el modal de "Carga masiva (CSV)" funcione.

## Notas adicionales

- Si ves errores de permiso en `next`, asegúrate de tener dependencias instaladas con los permisos correctos.
- Si usas un archivo `.env`, no lo subas al repositorio.
- Usa `.env.example` como plantilla para nuevos colaboradores.
