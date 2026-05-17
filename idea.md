# Insti ERP — Estado del Proyecto

## Flujo de Gestión Escolar

### Admisiones → Estudiantes + Tutores
1. Se registra admisión con estado **PENDIENTE**
2. En el modal de admisión se cambia estado: PENDIENTE → EN_TRAMITE → ADMITIDO / NO_ADMITIDO
3. Al pasar a **ADMITIDO**, aparece botón "Convertir a estudiante"
4. La conversión: crea el estudiante (con `admitted_at`), crea el tutor, matrícula en grado/sección, copia documentos
5. El estudiante aparece en `/dashboard/students` y el tutor en `/dashboard/guardians`

### Perfil del Estudiante (modal CV)
- **Datos**: Foto, nombre, documento, fecha, género, dirección, médicas, emergencia
- **Tutores**: Lista de tutores vinculados, añadir/quitar (solo en modo edición)
- **Calificaciones**: BarChart por criterio + lista detalle de notas
- **Asistencia**: PieChart distribución + lista historial
- **Conducta**: BarChart resumen por tipo + lista de reportes
- **Documentos**: Upload con nombre + lista con descarga/eliminar

### Perfil del Profesor (modal CV)
- **Datos**: Foto, nombre, especialidades (multi-select de asignaturas)
- **Asignaturas**: Lista de materias vinculadas con grado/sección
- **Horario**: Clases por día y hora
- **Documentos**: Upload/download

### Perfil del Tutor (modal CV)
- **Datos**: Nombre, parentesco, teléfono, email
- **Estudiantes Vinculados**: Lista con links al expediente de cada uno

### Dashboard por Rol
- **Director**: KPIs + analytics + IA predictiva
- **Secretaría**: Matrículas, admisiones pendientes, pagos
- **Profesor**: Horario del día, secciones, acceso rápido a aula virtual
- **Estudiante**: Mis tareas, notas, asistencia
- **Padre**: Hijos vinculados, rendimiento, pagos

### IA
- Gemini/DeepSeek configurable por SUPER_ADMIN
- Predicción de riesgo académico por sección
- Límite de tokens por institución (reset mensual)
- Caché de predicciones 24h

### Pagos
- Stripe + MercadoPago configurables por institución
- Planes de cobro recurrente (mensual, trimestral, anual)
- Generación masiva de facturas
- Dashboard de morosidad

## Próximos pasos

1. **Notificaciones ampliadas**: Pagos y mensajes
2. **Resend emails**: Recuperación de contraseña, notificaciones por email
3. **Aula Virtual**: Crear tarea, calificar entrega (ya implementado base)
4. **Testing**: Más tests unitarios + E2E
5. **Gráficos en Analytics**: Recharts (ya implementado en perfil de estudiante)
