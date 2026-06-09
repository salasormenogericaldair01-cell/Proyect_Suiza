# Sistema Estudiantil

Guía para colaboradores: instalación, dependencias y configuración de PostgreSQL.

## Requisitos previos

- Node.js 22.x o superior
- npm 10.x o superior
- PostgreSQL 14/15/16 instalado y corriendo localmente
- Git

## Estructura importante

- `app/` → interfaz y rutas de Next.js
- `app/api/usuarios/importar/route.ts` → endpoint para carga masiva de usuarios
- `app/dashboard/usuarios/ImportUsuariosModal.tsx` → modal de importación CSV
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
- `NEXTAUTH_SECRET`: clave secreta para NextAuth
- `GEMINI_API_KEY`: opcional, solo si usas la funcionalidad de IA en notas

## Base de datos PostgreSQL

El proyecto utiliza PostgreSQL. El nombre recomendado para la base de datos es:

```text
sistemaestudiantil
```

### Comandos para crear la base de datos

Usa estos comandos en tu terminal:

```bash
sudo -u postgres createdb sistemaestudiantil
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'admin123';"
```

Si tu instalación no usa `sudo` o tienes otro usuario, puedes ejecutar:

```bash
psql -U postgres -c "CREATE DATABASE sistemaestudiantil;"
```

### URL de ejemplo para `.env`

```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/sistemaestudiantil?schema=public"
NEXTAUTH_SECRET="cambia-por-una-clave-segura"
GEMINI_API_KEY="tu_gemini_api_key_aqui"
```

## Instalar dependencias

```bash
npm install
```

## Generar cliente Prisma y aplicar esquema

Si nunca has generado el cliente Prisma localmente:

```bash
npx prisma generate
```

Para sincronizar el esquema con la base de datos:

```bash
npx prisma db push
```

> Si prefieres aplicar las migraciones existentes del repositorio, usa:
>
> ```bash
> npx prisma migrate deploy
> ```

## Cargar datos iniciales (seed)

Si deseas crear el usuario inicial u otros datos de prueba, ejecuta:

```bash
npx prisma db seed
```

## Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Luego abre en el navegador:

```text
http://localhost:3001
```

> En este proyecto se ha usado `next dev` en modo Webpack para mayor compatibilidad, así que si necesitas puedes iniciar con:
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
- `app/dashboard/usuarios/ImportUsuariosModal.tsx`

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
