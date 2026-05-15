
# 🏫 AGENTS.md — ERP Escolar SaaS

## 📌 Proyecto

ERP escolar moderno, multi-tenant y multi-año, diseñado para colegios, institutos y academias.

El sistema permitirá gestionar:
- Estudiantes
- Profesores
- Padres/Tutores
- Asistencia
- Calificaciones
- Finanzas
- Comunicación interna
- Expedientes académicos
- Boletines y certificados
- Roles y permisos

El enfoque principal del proyecto es:
- Arquitectura escalable
- Código limpio y mantenible
- UI moderna y responsive
- Seguridad empresarial
- Alto rendimiento
- Experiencia móvil optimizada para profesores y padres

---

# 🧠 Filosofía de Desarrollo

Este proyecto sigue una metodología de:
- Clean Architecture
- Domain Driven Design (DDD)
- Component Driven Development
- API First
- Multi-tenant Ready
- Mobile First
- Security First

Todo el código generado debe:
- Ser modular
- Ser tipado estrictamente
- Evitar duplicación
- Tener separación clara de responsabilidades
- Ser altamente reutilizable
- Mantener naming consistente
- Ser fácil de escalar

---

# ⚙️ Stack Tecnológico

## Frontend
- Next.js 15+
- React 19+
- TypeScript
- TailwindCSS
- Shadcn/UI
- React Hook Form
- Zod
- TanStack Query
- Zustand
- Framer Motion

## Backend
- Next.js Server Actions + Route Handlers
- Prisma ORM
- PostgreSQL

## Auth
- Better Auth o Auth.js
- RBAC completo
- JWT + Session Strategy

## Infraestructura
- Vercel
- Supabase Storage (documentos)
- Resend (emails)
- Stripe (pagos)
- Docker

---

# 🏛️ Arquitectura General

## Estructura Principal

/apps
/web

/packages
/ui
/database
/auth
/types
/utils
/config

## Arquitectura Base

El sistema debe ser:

### Multi-Tenant
Cada colegio funciona como una organización aislada.

### Multi-Año Lectivo
Toda entidad importante debe pertenecer a:
- school_id
- academic_year_id

Nunca mezclar información de distintos años lectivos.

---

# 🔐 Sistema de Roles (RBAC)

## Roles principales

- SUPER_ADMIN
- DIRECTOR
- SECRETARIA
- PROFESOR
- PADRE
- ESTUDIANTE
- CONTABILIDAD

## Reglas

- Toda ruta debe validar permisos
- Nunca confiar en permisos del frontend
- Toda acción sensible requiere validación server-side
- Los permisos deben ser centralizados

---

# 🗄️ Reglas de Base de Datos

## Reglas Generales

- Todas las tablas usan UUID
- Timestamps obligatorios:
  - created_at
  - updated_at

- Soft delete:
  - deleted_at

- Índices obligatorios en:
  - school_id
  - academic_year_id
  - foreign keys
  - attendance dates
  - grade lookups

## Naming

### Tablas
snake_case plural

Ejemplo:
students
teacher_assignments

### Columnas
snake_case

### Relaciones
Siempre explícitas

---

# 📦 Módulos del Sistema

# 1️⃣ Secretaría y Admisiones

## Funcionalidades

- Preinscripciones
- Admisiones
- Gestión documental
- Expedientes
- Configuración académica

## Entidades

- students
- guardians
- admissions
- enrollments
- academic_levels
- grades
- sections

---

# 2️⃣ Gestión Docente

## Funcionalidades

- Gestión de profesores
- Especialidades
- Carga horaria
- Asignaciones académicas

## Entidades

- teachers
- subjects
- teacher_assignments
- schedules

---

# 3️⃣ Gestión del Aula

## Funcionalidades

- Asistencia
- Registro de notas
- Conducta
- Observaciones

## Reglas UX

Esta sección debe:
- Cargar rápido
- Ser optimizada para tablets
- Tener interacción mínima
- Permitir acciones masivas

## Entidades

- attendances
- grades
- grade_items
- behavior_reports

---

# 4️⃣ Boletines y Certificados

## Funcionalidades

- Cierre académico
- Generación PDF
- Certificados
- Historial académico

## Reglas

- PDFs generados server-side
- Templates desacoplados
- Soporte para firmas digitales

---

# 5️⃣ Comunicación

## Funcionalidades

- Anuncios
- Agenda
- Mensajería
- Notificaciones

## Reglas

- Evitar spam de padres
- Chats limitados por permisos
- Notificaciones desacopladas

## Entidades

- announcements
- conversations
- messages
- events
- notifications

---

# 6️⃣ Finanzas

## Funcionalidades

- Mensualidades
- Facturación
- Pagos online
- Morosidad

## Integraciones

- Stripe
- Transferencias bancarias

## Entidades

- invoices
- payments
- payment_methods
- financial_movements

---

# 👥 Dashboards por Rol

## Director
- KPIs generales
- Estadísticas
- Asistencia global
- Rendimiento académico

## Secretaría
- Matrículas
- Expedientes
- Certificados
- Pagos pendientes

## Profesor
- Horario
- Lista rápida
- Notas pendientes

## Padre
- Rendimiento
- Boletines
- Asistencia
- Pagos

## Estudiante
- Tareas
- Notas
- Calendario

---

# 🎨 Reglas UI/UX

## Diseño

Usar el `DESIGN.md` como fuente de verdad para colores, tipografía, spacing, shadows,
radios y especificaciones de componentes. El sistema es **profesional, corporativo y minimalista**:
- Paleta: Primary #1E3A5F (azul corporativo), Accent #2563EB, neutrales Slate
- Tipografía: Inter
- Shadcn/UI New York style (`rounded-md`, sombras sutiles, sin glows)

## Componentes

Obligatorio:
- Shadcn/UI New York style (`components.json` con `style: "new-york"`)
- Componentes reutilizables en `packages/ui`
- Tablas con TanStack Table + Shadcn
- Formularios con React Hook Form + Zod
- Iconos: Lucide React (20px default, 16px para inline)

## Responsive

Obligatorio:
- Mobile first (<768px: sidebar oculta, single-column)
- Tablet optimized (768-1023px: sidebar colapsada, two-column)
- Desktop adaptive (≥1024px: sidebar completa, multi-column)
- Touch targets ≥44px (WCAG AA)

---

# 🧩 Convenciones de Código

## TypeScript

Nunca usar:
- any
- ts-ignore

Siempre:
- Tipado explícito
- Schemas Zod
- Inferencias limpias

---

# 📂 Estructura Frontend

/src
/app
/components
/modules
/hooks
/services
/store
/lib
/types

## Regla

Cada módulo debe encapsular:
- components
- hooks
- services
- schemas
- types

---

# 🚨 Seguridad

## Obligatorio

- Validación server-side
- Sanitización inputs
- Rate limiting
- Protección CSRF
- Validación RBAC
- Logs de auditoría

## Nunca

- Exponer IDs sensibles
- Confiar en frontend
- Guardar secretos en cliente

---

# ⚡ Performance

## Reglas

- Server Components por defecto
- Lazy loading
- Suspense boundaries
- Optimistic UI
- Query caching
- Paginación obligatoria

## Base de datos

- Relaciones optimizadas
- Índices correctos
- Evitar N+1 queries

---

# 📑 Estándares API

## Respuestas

Formato estándar:

```ts
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}
```

## Errores

* Centralizados
* Human readable
* Logs internos separados

---

# 🧪 Testing

## Obligatorio

* Unit testing
* Integration testing
* E2E testing

## Herramientas

* Vitest
* Playwright

---

# 📝 Reglas para OpenCode AI

## Cuando generes código

Siempre:

* Explicar arquitectura
* Crear código modular
* Usar TypeScript estricto
* Crear componentes reutilizables
* Evitar lógica duplicada
* Separar UI y lógica

## Cuando generes componentes

Siempre:

* Accesibles
* Responsive
* Reutilizables
* Con loading states
* Con empty states
* Con error states

## Cuando generes formularios

Siempre:

* React Hook Form
* Zod
* Validaciones server/client

---

# 📌 Convenciones Git

## Branches

feature/
fix/
refactor/
hotfix/

## Commits

feat:
fix:
refactor:
docs:
chore:

---

# 🚀 Roadmap Inicial

## FASE 1

* Auth
* RBAC
* Multi-tenant
* Gestión académica base

## FASE 2

* Aula virtual
* Asistencia
* Notas

## FASE 3

* Comunicación
* Notificaciones

## FASE 4

* Finanzas
* Stripe

## FASE 5

* Analytics
* Reportes
* IA

---

# 🤖 Reglas de Generación IA

La IA debe priorizar:

1. Escalabilidad
2. Seguridad
3. Reutilización
4. Performance
5. UX profesional

Nunca generar:

* Código monolítico
* Componentes gigantes
* Queries inseguras
* Código sin tipado
* Lógica mezclada

---

# 🧠 Visión del Producto

El objetivo es construir un ERP escolar SaaS premium comparable a:

* Google Classroom
* Fedena
* Blackboard
* Moodle moderno
* Additio

Pero con:

* Mejor UX
* Arquitectura moderna
* Mobile experience superior
* Automatización avanzada
* Mejor rendimiento



