# Guía de Reorganización de Carpetas

Este documento explica cómo reorganizar el proyecto para seguir la estructura recomendada.

## Pasos de reorganización

### 1. Reorganizar carpetas (Rutas de agrupamiento)

En Next.js 13+, los paréntesis `()` son **rutas de agrupamiento mental** que no afectan las URLs.

Ejecuta estos comandos en el terminal:

```bash
# Crear la carpeta de agrupamiento (auth)
mkdir -p app/\(auth\)

# Mover login a (auth)
mv app/login app/\(auth\)/

# Crear la carpeta de agrupamiento (dashboard)
mkdir -p app/\(dashboard\)

# Mover dashboard a (dashboard)
mv app/dashboard app/\(dashboard\)/

# Crear carpeta de componentes compartidos
mkdir -p app/components
mkdir -p app/components/common
mkdir -p app/components/dashboard
```

### 2. Resultado esperado

Después de ejecutar los comandos anteriores, la estructura será:

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx
├── (dashboard)/
│   ├── usuarios/
│   │   ├── page.tsx
│   │   └── ImportUsuariosModal.tsx
│   ├── estudiantes/
│   ├── profesores/
│   ├── materias/
│   ├── notas/
│   └── layout.tsx
├── api/
│   ├── usuarios/
│   ├── estudiantes/
│   └── ...
├── components/
│   ├── common/
│   └── dashboard/
├── globals.css
└── layout.tsx
```

### 3. URLs resultantes

✅ Las URLs **NO cambian** porque los paréntesis son solo agrupamiento mental:

| Archivo | URL |
|---------|-----|
| `app/(auth)/login/page.tsx` | `/login` |
| `app/(dashboard)/usuarios/page.tsx` | `/dashboard/usuarios` |
| `app/api/usuarios/route.ts` | `/api/usuarios` |

### 4. Limpiar archivos innecesarios

Ejecuta en el terminal:

```bash
# Eliminar archivos que genera Next.js automáticamente
rm -f next-env.d.ts

# Eliminar archivo de config de Prisma si no lo usas
rm -f prisma.config.ts

# Agregar al .gitignore archivos que no deben estar en git
echo "next-env.d.ts" >> .gitignore
echo "*.rar" >> .gitignore
echo ".env" >> .gitignore
```

### 5. Agregar .gitignore correcto

Asegúrate de que `.gitignore` tenga:

```
# Dependencias
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Producción
/build
/dist

# Misc
.DS_Store
*.pem
*.log

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Archivos no necesarios
next-env.d.ts
prisma.config.ts
*.rar
```

### 6. Mover componentes a carpeta central

Si tienes componentes que se reutilizan, muévelos a `app/components/`:

```bash
# Ejemplo: si ImportUsuariosModal se usa en múltiples lugares
# Muévelo a componentes/dashboard/
mv app/\(dashboard\)/usuarios/ImportUsuariosModal.tsx app/components/dashboard/

# Luego actualiza el import en el archivo que lo usa:
# De: import ImportUsuariosModal from "./ImportUsuariosModal"
# A: import ImportUsuariosModal from "@/components/dashboard/ImportUsuariosModal"
```

### 7. Actualizar imports si es necesario

Si moviste componentes, actualiza los imports en los archivos que los usan.

Ejemplo en `app/(dashboard)/usuarios/page.tsx`:

```tsx
// Antes:
import ImportUsuariosModal from "./ImportUsuariosModal"

// Después:
import ImportUsuariosModal from "@/components/dashboard/ImportUsuariosModal"
```

### 8. Verificar que todo funciona

Después de reorganizar, compila el proyecto:

```bash
npm run build
```

Si hay errores, revisa:
- Imports incorrectos
- Rutas de archivos
- Véase si hay referencias a archivos eliminados

## Ventajas de esta reorganización

✅ **Claridad:** Fácil ver qué es frontend y qué es backend  
✅ **Escalabilidad:** Puedes agregar más rutas sin lío  
✅ **Mantenimiento:** Cambios localizados en sus carpetas  
✅ **Consistencia:** Todos en el equipo saben dónde buscar  

## Notas importantes

- Los paréntesis `()` en Next.js son **rutas de agrupamiento**, no afectan URLs
- No necesitas cambiar ninguna URL en la aplicación después de mover archivos
- Los imports con `@/` siguen funcionando igual
- El `.` alias puede seguir usando rutas relativas

## ¿Necesitas ayuda?

Si algo no funciona después de reorganizar:
1. Verifica que los imports apunten a las rutas correctas
2. Ejecuta `npm run build` para detectar errores
3. Revisa la consola de Next.js para errores de rutas
