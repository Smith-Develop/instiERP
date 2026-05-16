# 🏫 Insti ERP — Sistema de Gestión Escolar SaaS

ERP escolar moderno, multi-tenant y multi-año. Diseñado para colegios, institutos y academias.

---

## 📊 Estado del Proyecto

### ✅ Implementado (12 módulos — 100% CRUD)

| Módulo | Funcionalidades | API | Dashboard |
|---|---|---|---|
| **Auth + RBAC** | Login/logout, 7 roles, permisos granulares, middleware de sesión | `/api/auth/[...all]` | Login, sidebar por rol |
| **Estudiantes** | CRUD completo, buscador, paginación, soft delete | `GET/POST/PUT/DELETE /api/students/*` | Lista, crear, editar, documentos |
| **Profesores** | CRUD completo, especialidades, asignaciones | `GET/POST/PUT/DELETE /api/teachers/*` | Lista, crear, editar |
| **Tutores** | CRUD completo, parentesco, contacto | `GET/POST/PUT/DELETE /api/guardians/*` | Lista, crear, editar |
| **Admisiones** | Preinscripciones con estados (pendiente/aprobado/rechazado) | `GET/POST/PUT/DELETE /api/admissions/*` | Lista, crear, editar |
| **Asignaturas** | CRUD completo | `GET/POST/PUT/DELETE /api/subjects/*` | Lista, crear |
| **Académico** | Niveles, grados, secciones (vista configurable) | — | Vista anidada |
| **Matrículas** | Asignar estudiante a grado/sección/año | `POST /api/enrollments` | Crear, lista |
| **Asistencia** | Grid toggle (presente/ausente/tardanza/justificado), acciones masivas | `GET/POST /api/attendance` | Pasar lista por sección |
| **Calificaciones** | Criterios de evaluación (grade_items), entrada de notas inline | `GET/POST /api/grades/*` | Hoja de notas por sección/asignatura |
| **Conducta** | Reportes de comportamiento (observación, felicitación, incidencia, sanción) | `POST /api/behavior` | Lista, crear |
| **Aula Virtual** | Tareas, entregas, stream del aula, rúbricas, sync auto con notas | 10 endpoints `/api/classroom/*` | Stream + tareas (profesor), mis tareas (estudiante) |
| **Boletines** | PDF server-side (pdfkit), certificado individual, cierre de periodos | `POST /api/reports/boletin`, `/certificate`, `/close-period` | Descargar boletín, certificados, vista previa |
| **Comunicación** | Anuncios con notificaciones push, mensajería directa (conversaciones), anti-spam padres | `GET/POST /api/conversations/*`, `/api/announcements/*` | Hub, chat, nuevo mensaje, anuncios |
| **Notificaciones** | Campana en header, polling 30s, auto-generación (asistencia, anuncios) | `GET/POST /api/notifications` | Lista, badge no leídos |
| **Calendario** | Grid mensual con eventos coloreados por target, navegación | `GET/POST /api/events` (filtro rango) | Vista mes, crear evento |
| **Finanzas** | Facturas CRUD, KPIs (pendiente/pagado), pagos online | `GET/POST /api/invoices`, `/api/payments/*` | Lista, crear factura, botón pagar |
| **Pagos** | Stripe Checkout + MercadoPago, webhooks, configuración por colegio | `/api/payments/stripe/*`, `/mercadopago/*` | PayButton en finanzas |
| **Documentos** | Subida a Supabase Storage, lista, descarga, soft delete | `GET/POST /api/documents`, `DELETE [id]` | Upload en estudiante/admisión, lista global |
| **Asignaciones** | Profesor → materia → sección | `GET/POST /api/assignments`, `DELETE [id]` | Crear, lista, eliminar |
| **Configuración** | Perfil colegio, pagos (moneda, país, provider, API keys), años lectivos | `GET/PUT /api/schools` | Formulario completo |
| **Dashboards por rol** | Director (KPIs+asistencia), Secretaria (admisiones+pagos), Profesor (horario+secciones), Padre (hijos+facturas), Estudiante (notas+eventos) | — | 5 dashboards especializados |

### 🔜 Próximamente

| Módulo | Descripción |
|---|---|
| **Horarios** | Gestión de horarios de clase (día, hora, aula). API + UI |
| **Notificaciones ampliadas** | Auto-notificar en calificaciones, conducta, mensajes y pagos |
| **Audit logs** | Trazabilidad de acciones sensibles (quién, qué, cuándo) |
| **Morosidad** | Dashboard de facturas vencidas, alertas |
| **Analytics** | Gráficos de rendimiento, asistencia, finanzas (Recharts) |
| **IA** | Predicción de riesgo académico |
| **Email (Resend)** | Recuperación de contraseña, notificaciones por email |
| **Testing** | Más tests unitarios + integración + E2E |
| **Docker** | Dockerfile + docker-compose para despliegue |

---

## ⚙️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 15 · React 19 · TypeScript · TailwindCSS · Shadcn/UI (New York) · Framer Motion |
| **Formularios** | React Hook Form + Zod |
| **Estado/Data** | TanStack Query · Zustand |
| **Backend** | Next.js Server Actions + Route Handlers · Prisma ORM · PostgreSQL (Supabase) |
| **Auth** | Better Auth · RBAC (7 roles, 30+ permisos) · Session + JWT |
| **Storage** | Supabase Storage (documentos) |
| **Pagos** | Stripe · MercadoPago |
| **PDF** | PDFKit (server-side) |
| **Testing** | Vitest · Playwright · Testing Library |
| **Infra** | Vercel · pnpm monorepo · Turbo |

---

## 🏛️ Arquitectura

```
insti/
├── apps/web/          # Next.js 15 App Router
│   ├── src/app/
│   │   ├── (auth)/login/      # Login
│   │   ├── dashboard/         # 23 páginas (CRUDs, aula, finanzas, etc.)
│   │   ├── api/               # 51 endpoints REST
│   │   └── middleware.ts      # Protección de rutas
│   └── src/modules/           # 15 módulos (components, hooks, schemas)
├── packages/
│   ├── auth/          # Better Auth + RBAC (roles, permisos)
│   ├── database/      # Prisma schema (35+ modelos) + seed
│   ├── ui/            # 18 componentes Shadcn/UI New York
│   ├── types/         # Tipos compartidos
│   ├── utils/         # Formateo, cn()
│   └── config/        # Constantes
├── pnpm-workspace.yaml
├── turbo.json
└── DESIGN.md          # Sistema de diseño
```

---

## 🚀 Setup Rápido

```bash
# 1. Clonar e instalar
git clone <repo-url> && cd Insti
pnpm install

# 2. Configurar .env (copiar de .env.example)
cp .env.example .env
# Editar: DATABASE_URL, DIRECT_URL, BETTER_AUTH_SECRET,
# NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY

# 3. Sincronizar DB
pnpm db:push

# 4. Sembrar datos demo
pnpm db:seed

# 5. Arrancar
pnpm dev
# → http://localhost:3000
# → Login: admin@insti.dev / admin123
```

---

## 📁 Comandos

```bash
pnpm dev           # Dev server
pnpm build         # Build producción
pnpm test          # Unit tests (Vitest)
pnpm test:e2e      # E2E tests (Playwright)
pnpm db:push       # Sincronizar schema
pnpm db:seed       # Sembrar datos demo
pnpm db:studio     # Prisma Studio
```

---

## 🔐 Roles y Permisos

| Rol | Acceso |
|---|---|
| **SUPER_ADMIN** | Todo (`*`) |
| **DIRECTOR** | KPIs, estudiantes, profesores, asistencia, calificaciones, boletines, comunicación, finanzas (read), configuración |
| **SECRETARIA** | Estudiantes, tutores, admisiones, matrículas, asignaturas, certificados, finanzas (read) |
| **PROFESOR** | Asistencia, calificaciones, conducta, comunicación, aula virtual, horario |
| **PADRE** | Ver hijos (rendimiento, asistencia, pagos), comunicación, pagar facturas |
| **ESTUDIANTE** | Sus notas, asistencia, tareas del aula virtual, calendario |
| **CONTABILIDAD** | Finanzas (full), pagos, facturas, reportes |

---

## 📊 Stats

```
69 páginas | 51 API routes | 35+ modelos DB | 30+ permisos RBAC
11 unit tests | 4 E2E tests | ~15,000 líneas de código
```
