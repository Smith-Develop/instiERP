# AGENTS.md — Insti ERP

Monorepo ERP escolar con Next.js 15, Prisma, Better Auth, Supabase, TailwindCSS + Shadcn/UI New York.

## Setup

```bash
pnpm install
cp .env.example .env   # completar DATABASE_URL, BETTER_AUTH_SECRET, SUPABASE keys
pnpm db:push           # sincronizar schema
pnpm db:seed           # datos demo
pnpm dev               # → localhost:3000
```

## Comandos

```bash
pnpm dev               # dev server
pnpm build             # build producción
pnpm test              # vitest (20 unit tests)
pnpm test:e2e          # playwright
pnpm db:push           # schema → DB sin migraciones
pnpm db:seed           # correr seed
pnpm db:generate       # regenerar Prisma client
```

## Arquitectura

```
apps/web/              # Next.js 15 App Router
  src/app/api/         # 70+ endpoints REST
  src/app/dashboard/   # 25+ páginas
  src/modules/         # lógica por módulo (schemas, modals, tables)
  src/lib/             # utilidades (session, api-context, audit, storage, email)
packages/
  auth/                # Better Auth + roles + permisos
  database/            # Prisma schema + client
  ui/                  # componentes Shadcn/UI New York
  types/ utils/ config/
```

## Patrones obligatorios

### API routes — siempre usar `getApiContext` + `guard`

```ts
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function POST(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.STUDENTS_WRITE);   // 403 si no tiene permiso
  // ...
}
```

Permisos en `packages/auth/src/roles.ts` → `PERMISSIONS.STUDENTS_READ`, etc. Usar constantes, nunca strings.

### Formularios — React Hook Form + Zod

```tsx
const schema = z.object({ name: z.string().min(1) });
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
// <form onSubmit={handleSubmit(onSubmit)}>
// <Input {...register("name")} />
// {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
```

### Modales CV-style para entidades principales

Estudiantes, profesores y admisiones usan modales con:
- Header gradiente (`bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A]`)
- Navegación por secciones (barra horizontal con pestañas)
- Cada sección en `<div className="rounded-lg border bg-white p-6">`
- Edición inline con toggle `editing` state
- Delete con confirmación en dos pasos
- Upload de documentos con campo de nombre

Las páginas standalone `new` y `[id]` fueron eliminadas. TODO se hace desde modales.

### Tablas — solo link "Ver", no botones editar/eliminar

Los botones de acción están solo dentro del modal. La tabla muestra un `<button className="text-sm text-[#2563EB] hover:underline">Ver</button>`.

### Sidebar — grupos con encabezados

En `dashboard/layout.tsx`, `allNavGroups` define 6 grupos: Principal, Gestión Escolar, Académico, Aula, Comunicación, Administración. Cada grupo tiene `title` + `items[]`. Filtrado por `hasPermission(role, item.permission)`.

## Gotchas

### `@db.Uuid` rompe Better Auth
Las tablas `session`, `account`, `verification` NO deben tener `@db.Uuid` en el `id`. Better Auth genera IDs no-UUID. Solo `user.id` lo tiene.

### Rutas estáticas con paréntesis
PowerShell no maneja bien `(dashboard)` en nombres de carpeta. Usar `LiteralPath`:
```powershell
Remove-Item -Recurse -Force -LiteralPath "apps\web\src\app\dashboard\students\[id]"
```

### `NODE_ENV` es "production" durante build
`getSessionContext()` y `getApiContext()` usan fallback dev solo si no hay sesión. No lanzar errores en Server Components porque Next.js intenta prerenderizar en build. El middleware ya bloquea acceso sin cookie.

### Tailwind config — usar ESM imports
```ts
import tailwindcssAnimate from "tailwindcss-animate";  // no require()
plugins: [tailwindcssAnimate],
```

### `<form>` no puede abarcar múltiples `<Card>` siblings
Si el formulario tiene varias Cards, el `<form>` debe envolverlas a todas. Cada Card es un `<div>`, no un `<form>` independiente. El `<form onSubmit>` está en el padre y el `<Button type="submit">` en el último CardFooter.

### Documentos: nombrar antes de subir
El `DocumentList` y los modales tienen campo `docName` + file input. El archivo se renombra antes de subir: `new File([file], name, {type: file.type})`.

### Prisma Json fields
`details: details ?? undefined` (no `?? null`). Prisma no acepta `null` en campos Json.

## Referencias clave

| Qué | Dónde |
|---|---|
| Permisos y roles | `packages/auth/src/roles.ts` |
| Schema DB | `packages/database/prisma/schema.prisma` |
| Sistema de diseño | `DESIGN.md` |
| Estado del proyecto | `README.md` |
| Seed datos demo | `packages/database/prisma/seed.ts` |
| Sesión server | `apps/web/src/lib/session.ts` |
| Contexto API | `apps/web/src/lib/api-context.ts` |
| Middleware | `apps/web/src/middleware.ts` |
| Storage | `apps/web/src/lib/storage.ts` |
| Email | `apps/web/src/lib/email.ts` |
| Auditoría | `apps/web/src/lib/audit.ts` |

## Stats

```
79 páginas | 70+ API routes | 44+ modelos DB | 33+ permisos RBAC
20 unit tests | 9 E2E tests | 34 commits
```
