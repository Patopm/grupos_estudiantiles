# Plataforma de Gestión de Grupos Estudiantiles - Tecmilenio

## Descripción del Proyecto

Sistema web para la gestión integral de grupos estudiantiles en Tecmilenio, permitiendo a estudiantes, presidentes de grupos y administradores interactuar con los grupos de manera organizada y eficiente.

## Roles de Usuario

### 1. Estudiante

- **Funcionalidades principales:**
  - Ver catálogo de grupos estudiantiles disponibles
  - Solicitar ingreso a grupos estudiantiles
  - Ver eventos de sus grupos
  - Participar/confirmar asistencia a eventos
  - Salirse de grupos estudiantiles
  - Ver historial de participación

### 2. Presidente de Grupo Estudiantil

- **Funcionalidades principales:**
  - Gestionar solicitudes de ingreso (aprobar/rechazar)
  - Crear y administrar eventos del grupo
  - Ver lista de miembros del grupo
  - Gestionar salidas de miembros
  - Editar información básica del grupo
  - Ver estadísticas del grupo (asistencia, participación)

### 3. Administrador

- **Funcionalidades principales:**
  - CRUD completo de grupos estudiantiles
  - Asignar/cambiar presidentes de grupos
  - Gestionar usuarios del sistema
  - Ver reportes y estadísticas globales
  - Moderar contenido y actividades

## Funcionalidades del Sistema

### Landing Page

- **Carrusel de grupos estudiantiles:**
  - Mostrar grupos activos con imágenes representativas
  - Información básica: nombre, descripción breve, número de miembros
  - Enlace para ver detalles o solicitar ingreso
- **Secciones adicionales:**
  - Eventos próximos destacados
  - Estadísticas generales (número de grupos, estudiantes activos)
  - Testimonios de estudiantes

### Dashboard por Rol

#### Dashboard Estudiante

- Mis grupos estudiantiles
- Eventos próximos
- Solicitudes pendientes
- Historial de participación
- Explorar nuevos grupos

#### Dashboard Presidente

- Resumen del grupo
- Solicitudes de ingreso pendientes
- Gestión de eventos
- Lista de miembros
- Estadísticas del grupo

#### Dashboard Administrador

- Resumen general del sistema
- Gestión de grupos estudiantiles
- Gestión de usuarios
- Reportes y analytics
- Configuración del sistema

## Requerimientos Técnicos

### Frontend (Next.js + TypeScript)

#### Páginas Principales

```txt
/                           # Landing page con carrusel
/auth/login                 # Inicio de sesión
/auth/register             # Registro de usuarios
/dashboard                 # Dashboard principal (dinámico por rol)
/groups                    # Catálogo de grupos
/groups/[id]               # Detalle de grupo específico
/events                    # Lista de eventos
/events/[id]               # Detalle de evento específico
/profile                   # Perfil de usuario
/admin                     # Panel de administración
```

#### Componentes Clave

- **CarouselGroups**: Carrusel de grupos para landing
- **GroupCard**: Tarjeta de grupo estudiantil
- **EventCard**: Tarjeta de evento
- **MemberList**: Lista de miembros con acciones
- **RequestList**: Lista de solicitudes con aprobar/rechazar
- **GroupForm**: Formulario de creación/edición de grupos
- **EventForm**: Formulario de creación/edición de eventos
- **DashboardStats**: Componente de estadísticas
- **UserManagement**: Gestión de usuarios (admin)

#### Estados y Contextos

- **AuthContext**: Manejo de autenticación y roles
- **GroupsContext**: Estado global de grupos
- **EventsContext**: Estado global de eventos
- **NotificationContext**: Sistema de notificaciones

#### Librerías Recomendadas

- **UI**: Shadcn/ui, Tailwind CSS
- **Formularios**: React Hook Form + Zod
- **Estado**: Zustand o Context API
- **Peticiones**: Axios o Fetch API
- **Carrusel**: Swiper.js o Embla Carousel
- **Iconos**: Lucide React
- **Fechas**: date-fns
- **Notificaciones**: React Hot Toast

### Backend (Django + DRF)

#### Modelos de Datos

```python
# Modelo Usuario (extendiendo User de Django)
class CustomUser(AbstractUser):
    role = CharField(choices=USER_ROLES)
    student_id = CharField()  # Matrícula
    phone = CharField()
    is_active_student = BooleanField()

# Modelo Grupo Estudiantil
class StudentGroup:
    group_id = UUIDField()
    name = CharField()
    description = TextField()
    image = ImageField()
    president = ForeignKey(CustomUser)
    created_at = DateTimeField()
    is_active = BooleanField()
    max_members = IntegerField()
    category = CharField()  # Deportivo, Cultural, Académico, etc.

# Modelo Membresía
class GroupMembership:
    membership_id = UUIDField()
    user = ForeignKey(CustomUser)
    group = ForeignKey(StudentGroup)
    status = CharField()  # pending, active, inactive
    joined_at = DateTimeField()
    role = CharField()  # member, president

# Modelo Evento
class Event:
    event_id = UUIDField()
    title = CharField()
    description = TextField()
    event_type = CharField()
    status = CharField()
    target_groups = ManyToManyField(StudentGroup)
    start_datetime = DateTimeField()
    end_datetime = DateTimeField()
    location = CharField()
    max_attendees = IntegerField()
    registration_deadline = DateTimeField()
    requires_registration = BooleanField()
    image = ImageField()
    created_at = DateTimeField()
    updated_at = DateTimeField()

# Modelo Asistencia a Evento
class EventAttendance:
    attendance_id = UUIDField()
    event = ForeignKey(Event)
    user = ForeignKey(CustomUser)
    status = CharField()  # registered, confirmed, attended, no_show, cancelled
    registration_date = DateTimeField()
    notes = TextField()
    updated_at = DateTimeField()
    registered_at = DateTimeField()
```

#### APIs REST Endpoints

```txt
# Autenticación
POST /api/auth/login/
POST /api/auth/register/
POST /api/auth/logout/
GET  /api/auth/me/

# Grupos Estudiantiles
GET    /api/groups/                    # Lista pública de grupos
POST   /api/groups/                    # Crear grupo (admin)
GET    /api/groups/{id}/               # Detalle de grupo
PUT    /api/groups/{id}/               # Actualizar grupo (admin/president)
DELETE /api/groups/{id}/               # Eliminar grupo (admin)
GET    /api/groups/{id}/members/       # Miembros del grupo
POST   /api/groups/{id}/join/          # Solicitar ingreso
POST   /api/groups/{id}/leave/         # Salirse del grupo
GET    /api/groups/{id}/requests/      # Solicitudes pendientes (president)
POST   /api/groups/{id}/requests/{user_id}/approve/  # Aprobar solicitud
POST   /api/groups/{id}/requests/{user_id}/reject/   # Rechazar solicitud

# Eventos
GET    /api/events/                    # Lista de eventos
POST   /api/events/                    # Crear evento (president)
GET    /api/events/{id}/               # Detalle de evento
PUT    /api/events/{id}/               # Actualizar evento (creator)
DELETE /api/events/{id}/               # Eliminar evento (creator/admin)
POST   /api/events/{id}/attend/        # Confirmar asistencia
GET    /api/events/{id}/attendees/     # Lista de asistentes

# Dashboard
GET /api/dashboard/student/            # Datos dashboard estudiante
GET /api/dashboard/president/          # Datos dashboard presidente
GET /api/dashboard/admin/              # Datos dashboard admin

# Usuarios (Admin)
GET    /api/users/                     # Lista de usuarios
PUT    /api/users/{id}/role/           # Cambiar rol de usuario
```

#### Permisos y Autenticación

- **JWT Authentication** para manejo de sesiones
- **Permisos personalizados** por rol
- **Middleware de autorización** para endpoints sensibles
- **Rate limiting** para prevenir abuso

### Base de Datos

- **PostgreSQL** como base de datos principal
- **Redis** para cache y sesiones
- **Migraciones** bien documentadas
- **Índices** optimizados para consultas frecuentes

### Servicios Adicionales

#### Sistema de Notificaciones

- **Email notifications** para eventos importantes
- **Push notifications** (futuro)
- **In-app notifications** para actividades del grupo

#### Storage de Archivos

- **AWS S3** o similar para imágenes de grupos
- **Compresión automática** de imágenes
- **CDN** para optimización de carga

#### Monitoreo y Analytics

- **Logging** estructurado
- **Métricas** de uso del sistema
- **Reportes** de actividad estudiantil

## Flujos de Usuario Principales

### Flujo de Registro de Estudiante

1. Estudiante accede al landing
2. Ve carrusel de grupos disponibles
3. Se registra en el sistema
4. Completa perfil con matrícula
5. Explora y solicita ingreso a grupos

### Flujo de Gestión de Grupo (Presidente)

1. Presidente recibe notificación de nueva solicitud
2. Revisa perfil del solicitante
3. Aprueba o rechaza solicitud
4. Crea eventos para el grupo
5. Gestiona asistencia y participación

### Flujo de Administración

1. Admin crea nuevos grupos estudiantiles
2. Asigna presidentes a grupos
3. Monitorea actividad del sistema
4. Genera reportes de participación

## Consideraciones de UX/UI

### Diseño Responsive

- **Mobile-first** approach
- **Breakpoints** optimizados para tablets y desktop
- **Touch-friendly** interfaces
- **Dark mode**

### Accesibilidad

- **WCAG 2.1** compliance
- **Keyboard navigation**
- **Screen reader** compatibility
- **Color contrast** adecuado
- **Contraste de color** adecuado
- **Texto legibles**
- **Alt text** para imágenes

### Performance

- **Lazy loading** de imágenes
- **Code splitting** por rutas
- **Optimización** de bundle size
- **Caching** estratégico

## Roadmap de Desarrollo

### Fase 1 (MVP)

- [ ] Sistema de autenticación
- [ ] CRUD básico de grupos
- [ ] Landing con carrusel
- [ ] Dashboard básico por rol

### Fase 2

- [ ] Sistema de eventos completo
- [ ] Notificaciones por email
- [ ] Panel de administración avanzado
- [ ] Reportes básicos

### Fase 3

- [ ] Sistema de notificaciones push
- [ ] Analytics avanzados
- [ ] Integración con sistemas Tecmilenio
- [ ] App móvil (React Native)

## Notas de Implementación

### Seguridad

- Validación estricta de datos de entrada
- Sanitización de contenido generado por usuarios
- Rate limiting en endpoints críticos
- Logs de auditoría para acciones administrativas

### Escalabilidad

- Arquitectura preparada para crecimiento
- Base de datos optimizada con índices
- Cache estratégico con Redis
- CDN para assets estáticos

### Mantenibilidad

- Código bien documentado
- Tests unitarios y de integración
- CI/CD pipeline configurado
- Monitoreo de errores y performance
