# 🔐 GUÍA DE ROLES, INTERFACES Y PERMISOS
## Sistema de Gestión Estudiantil - IESTP Suiza

---

## 📋 TABLA DE CONTENIDOS

1. [Definición de Roles](#definición-de-roles)
2. [Permisos por Rol](#permisos-por-rol)
3. [Interfaces y Vistas](#interfaces-y-vistas)
4. [Rutas Protegidas](#rutas-protegidas)
5. [Checklist de Implementación](#checklist-de-implementación)

---

## 🎭 DEFINICIÓN DE ROLES

```typescript
enum Role {
  ADMIN      // Administrador del sistema
  SUPPORT    // Personal de soporte
  TEACHER    // Profesor/Docente
  STUDENT    // Estudiante
  PARENT     // Padre/Apoderado de familia
}
```

---

## 🔑 PERMISOS POR ROL

### 1. **ADMIN**
- ✅ Acceso total al sistema
- ✅ Gestión de usuarios (crear, editar, eliminar, activar/desactivar)
- ✅ Gestión de estudiantes (registrar, modificar, asignar carrera/ciclo)
- ✅ Gestión de profesores (registrar, asignar materias)
- ✅ Gestión de materias (crear, editar, asignar a profesor)
- ✅ Gestión de notas (crear, editar, ver todas)
- ✅ Gestión de asistencia (crear, editar, ver todas)
- ✅ Crear y editar anuncios globales
- ✅ Ver calendarios académicos
- ✅ Importar/exportar datos (usuarios, estudiantes)
- ✅ Generación de reportes
- ✅ Logs de actividad

### 2. **SUPPORT**
- ✅ Acceso limitado a usuario/operaciones
- ✅ Ver listado de usuarios
- ✅ Ver listado de estudiantes
- ✅ Ver listado de profesores
- ✅ Ver listado de materias
- ✅ Ver notas (lectura)
- ✅ Ver asistencia (lectura)
- ✅ Crear anuncios
- ✅ Ver calendario académico
- ❌ No puede eliminar usuarios
- ❌ No puede modificar notas
- ❌ No puede modificar asistencia

### 3. **TEACHER (Profesor)**
- ✅ Ver su perfil y datos personales
- ✅ Ver las materias que imparte
- ✅ Crear/editar notas de sus estudiantes
- ✅ Ver asistencia de sus estudiantes
- ✅ Crear/editar anuncios para sus estudiantes
- ✅ Ver calendario académico
- ✅ Ver resumen de desempeño estudiantil
- ❌ No puede ver datos de otros profesores
- ❌ No puede modificar otra materia
- ❌ No puede ver estudiantes de otros profesores

### 4. **STUDENT (Estudiante)**
- ✅ Ver su perfil
- ✅ Ver sus notas (calificaciones)
- ✅ Ver su asistencia
- ✅ Ver anuncios
- ✅ Ver calendario académico
- ✅ Ver sus materias inscritas
- ❌ No puede editar sus notas
- ❌ No puede ver datos de otros estudiantes
- ❌ No puede ver asistencia de otros

### 5. **PARENT (Apoderado)**
- ✅ Ver perfil de su familia
- ✅ Ver notas de sus hijos registrados
- ✅ Ver asistencia de sus hijos
- ✅ Ver anuncios generales
- ✅ Ver calendario académico
- ✅ Ver datos académicos de sus hijos
- ❌ No puede ver datos de otros apoderados
- ❌ No puede ver estudiantes sin relación
- ❌ No puede modificar información

---

## 🖥️ INTERFACES Y VISTAS

### Dashboard Principal
```
/dashboard
├── Usuarios (ADMIN, SUPPORT)
├── Estudiantes (ADMIN, SUPPORT, TEACHER - solo sus alumnos)
├── Profesores (ADMIN, SUPPORT)
├── Materias (ADMIN, SUPPORT, TEACHER)
├── Notas (ADMIN, SUPPORT, TEACHER - solo sus alumnos, STUDENT - solo suyas)
├── Asistencia (ADMIN, SUPPORT, TEACHER - solo sus alumnos, STUDENT - solo suya)
├── Anuncios (ADMIN, SUPPORT, TEACHER - crear, STUDENT/PARENT - ver)
└── Calendario (todos)
```

### Panel de Estudiante
```
/dashboard/estudiante
├── Mis notas
├── Mi asistencia
├── Mis materias
└── Anuncios
```

### Panel de Profesor
```
/dashboard/profesor
├── Mis materias
├── Mis estudiantes
├── Crear/editar notas
├── Crear/editar asistencia
├── Resumen de desempeño
└── Anuncios
```

### Panel de Familia
```
/dashboard/familia
├── Mis hijos
├── Notas de mis hijos
├── Asistencia de mis hijos
├── Datos académicos
└── Anuncios
```

### Panel de Admin
```
/dashboard
├── Usuarios
│  ├── Listar
│  ├── Crear
│  ├── Editar
│  ├── Eliminar
│  ├── Activar/Desactivar
│  ├── Importar (CSV/Excel)
│  └── Exportar
├── Estudiantes
│  ├── Listar
│  ├── Crear
│  ├── Editar
│  ├── Eliminar
│  ├── Asignar carrera/ciclo
│  └── Asignar padre
├── Profesores
│  ├── Listar
│  ├── Crear
│  ├── Editar
│  ├── Asignar materias
│  └── Cambiar especialidad
├── Materias
│  ├── Listar
│  ├── Crear
│  ├── Editar
│  ├── Asignar profesor
│  └── Asignar carrera
├── Notas
│  ├── Listar todas
│  ├── Crear
│  ├── Editar
│  ├── Filtrar por estudiante/materia/periodo
│  └── Exportar
├── Asistencia
│  ├── Listar todas
│  ├── Registrar
│  ├── Editar
│  ├── Filtrar por fecha/materia
│  └── Reportes
├── Anuncios
│  ├── Crear
│  ├── Editar
│  └── Eliminar
├── Calendario
│  ├── Ver eventos
│  ├── Crear eventos
│  └── Editar eventos
└── Reportes
   ├── Desempeño estudiantil
   ├── Asistencia por periodo
   ├── Notas por carrera
   └── Logs de actividad
```

---

## 🛡️ RUTAS PROTEGIDAS

### Rutas públicas
```
/login
/reset-password
/forgot-password
```

### Rutas privadas (autenticación requerida)
```
/dashboard                     [ADMIN, SUPPORT, TEACHER, STUDENT, PARENT]
/dashboard/usuarios            [ADMIN, SUPPORT]
/dashboard/estudiantes         [ADMIN, SUPPORT, TEACHER - filtrado]
/dashboard/profesores          [ADMIN, SUPPORT]
/dashboard/materias            [ADMIN, SUPPORT, TEACHER]
/dashboard/notas               [ADMIN, SUPPORT, TEACHER - filtrado, STUDENT - suyas]
/dashboard/asistencia          [ADMIN, SUPPORT, TEACHER - filtrado, STUDENT - suya]
/dashboard/anuncios            [TODOS]
/dashboard/calendario          [TODOS]
/dashboard/estudiante          [STUDENT]
/dashboard/profesor            [TEACHER]
/dashboard/familia             [PARENT]
/dashboard/profesor/resumen    [TEACHER]
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Middleware y Autenticación
- [ ] Crear middleware de autenticación en `/middleware.ts`
- [ ] Validar sesión en todas las rutas privadas
- [ ] Verificar rol del usuario
- [ ] Redirigir si no tiene permisos

### Guard de Rutas por Rol
- [ ] Crear función `canAccess(role, route)` en `lib/authz.ts`
- [ ] Proteger `/dashboard/usuarios` solo para ADMIN/SUPPORT
- [ ] Proteger `/dashboard/estudiantes` con filtrado por rol
- [ ] Proteger `/dashboard/notas` con filtrado por rol
- [ ] Proteger `/dashboard/asistencia` con filtrado por rol

### Componentes de UI por Rol
- [ ] Mostrar sidebar diferente según rol (ya existe)
- [ ] Mostrar botones de acciones según permisos
- [ ] Ocultar campos sensibles según rol
- [ ] Deshabilitar botones de edición/eliminación si no tiene permisos

### API Routes - Agregar Validación de Permisos
- [ ] `/api/usuarios` → validar ADMIN/SUPPORT
- [ ] `/api/estudiantes` → validar ADMIN/SUPPORT/TEACHER
- [ ] `/api/profesores` → validar ADMIN/SUPPORT
- [ ] `/api/materias` → validar ADMIN/SUPPORT/TEACHER
- [ ] `/api/notas` → validar con filtrado por rol
- [ ] `/api/asistencia` → validar con filtrado por rol
- [ ] `/api/anuncios` → validar creación por ADMIN/SUPPORT/TEACHER
- [ ] `/api/calendario` → acceso público dentro de la app

### Activity Logs
- [ ] Registrar creación de usuarios (ADMIN/SUPPORT)
- [ ] Registrar modificación de notas (ADMIN/TEACHER)
- [ ] Registrar cambios de asistencia (ADMIN/TEACHER)
- [ ] Registrar login de usuarios
- [ ] Registrar logout de usuarios

### Vistas a Pulir
- [ ] `/dashboard` - Dashboard principal por rol
- [ ] `/dashboard/usuarios` - CRUD de usuarios
- [ ] `/dashboard/estudiantes` - CRUD de estudiantes
- [ ] `/dashboard/profesores` - CRUD de profesores
- [ ] `/dashboard/materias` - CRUD de materias
- [ ] `/dashboard/notas` - Gestión de notas
- [ ] `/dashboard/asistencia` - Gestión de asistencia
- [ ] `/dashboard/anuncios` - Crear/editar anuncios
- [ ] `/dashboard/calendario` - Ver/crear eventos
- [ ] `/dashboard/estudiante` - Panel de estudiante
- [ ] `/dashboard/profesor` - Panel de profesor
- [ ] `/dashboard/familia` - Panel de familia

### Testing
- [ ] Probar acceso como ADMIN
- [ ] Probar acceso como SUPPORT
- [ ] Probar acceso como TEACHER
- [ ] Probar acceso como STUDENT
- [ ] Probar acceso como PARENT
- [ ] Verificar que no pueda acceder a rutas no autorizadas

---

## 📝 NOTAS

- El filtrado de datos debe ocurrir a nivel de API, no solo en UI
- Los logs de actividad ayudan con auditoría
- Considerar guardar logs en BD para análisis posterior
- Implementar rate limiting en APIs
- Usar transacciones en BD para operaciones críticas

---

## 🚀 PRÓXIMAS ACCIONES

1. Implementar middleware de autenticación
2. Crear funciones de validación de permisos en `lib/authz.ts`
3. Agregar validación en todas las API routes
4. Pulir componentes de UI según cada rol
5. Crear sistema de logs de actividad
6. Testing completo de permisos

---

**Última actualización:** 12 de junio de 2026
**Estado:** En desarrollo
