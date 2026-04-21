# API Routes Guide

Base URL: `/api`

Este documento explica para qué sirve cada ruta, si es pública o requiere rol admin, y qué datos espera.

## Auth

### `POST /api/auth/register`
- Acceso: `Público`
- Propósito: registrar un usuario y crear sesión (cookie `token`).
- Body:
```json
{
  "name": "Admin",
  "email": "admin@site.com",
  "password": "123456"
}
```

### `POST /api/auth/login`
- Acceso: `Público`
- Propósito: iniciar sesión y crear cookie `token`.
- Body:
```json
{
  "email": "admin@site.com",
  "password": "123456"
}
```

### `POST /api/auth/logout`
- Acceso: `Público`
- Propósito: cerrar sesión (limpia cookie `token`).

### `POST /api/auth/forgotpassword`
- Acceso: `Público`
- Propósito: solicitar recuperación de contraseña por email.
- Body:
```json
{
  "email": "admin@site.com"
}
```

### `PUT /api/auth/resetpassword/:resettoken`
- Acceso: `Público`
- Propósito: cambiar contraseña usando token de recuperación.
- Params: `resettoken`
- Body:
```json
{
  "password": "new_secure_password"
}
```

### `GET /api/auth/me`
- Acceso: `Privado` (usuario logueado)
- Propósito: obtener el perfil del usuario autenticado.

## Users

### `PUT /api/users/profile`
- Acceso: `Privado`
- Propósito: actualizar perfil del usuario logueado.

### `PUT /api/users/password`
- Acceso: `Privado`
- Propósito: actualizar contraseña del usuario logueado.

### `GET /api/users`
- Acceso: `Privado Admin`
- Propósito: listar usuarios.

### `GET /api/users/:id`
- Acceso: `Privado Admin`
- Propósito: obtener un usuario por ID.

### `PUT /api/users/:id`
- Acceso: `Privado Admin`
- Propósito: actualizar datos de usuario por ID.

### `DELETE /api/users/:id`
- Acceso: `Privado Admin`
- Propósito: eliminar usuario por ID.

## Projects

### `GET /api/projects`
- Acceso: `Público`
- Propósito: listar proyectos publicados (puede filtrar por estado).
- Query opcional: `status=completed|in_progress|planned`

### `GET /api/projects/:id`
- Acceso: `Público`
- Propósito: ver detalle de proyecto publicado.

### `GET /api/projects/admin/list`
- Acceso: `Privado Admin`
- Propósito: listar todos los proyectos (publicados o no).
- Query opcional:
  - `status=completed|in_progress|planned`
  - `isPublished=true|false`

### `POST /api/projects/admin`
- Acceso: `Privado Admin`
- Propósito: crear proyecto nuevo.
- Body ejemplo:
```json
{
  "title": "Mi SaaS",
  "domain": "mi-saas.com",
  "description": "Plataforma para gestión comercial",
  "stack": ["Node.js", "React", "MongoDB"],
  "status": "completed",
  "isPublished": true,
  "screenshots": [
    { "title": "Home", "imageUrl": "https://cdn.site.com/projects/home.png" },
    { "title": "Dashboard", "imageUrl": "https://cdn.site.com/projects/dashboard.png" }
  ]
}
```

### `POST /api/projects/admin/upload-image`
- Acceso: `Privado Admin`
- Propósito: subir imagen de proyecto a S3 y obtener URL.
- Body:
```json
{
  "imageBase64": "data:image/png;base64,...."
}
```

### `PUT /api/projects/admin/:id`
- Acceso: `Privado Admin`
- Propósito: actualizar proyecto por ID.

### `DELETE /api/projects/admin/:id`
- Acceso: `Privado Admin`
- Propósito: eliminar proyecto por ID.

## Reviews

### `GET /api/reviews`
- Acceso: `Público`
- Propósito: listar reseñas aprobadas/publicadas.

### `POST /api/reviews`
- Acceso: `Público`
- Propósito: cliente envía reseña sin login.
- Nota: la foto es obligatoria y se sube a S3.
- Body:
```json
{
  "name": "Ana Perez",
  "company": "Acme Inc",
  "rating": 5,
  "review": "Excelente equipo de desarrollo, cumplieron con calidad y tiempos.",
  "photoBase64": "data:image/jpeg;base64,...."
}
```

### `GET /api/reviews/admin/list`
- Acceso: `Privado Admin`
- Propósito: listar reseñas para moderación.
- Query opcional: `status=pending|approved|rejected`

### `PATCH /api/reviews/admin/:id`
- Acceso: `Privado Admin`
- Propósito: moderar reseña (aprobar/rechazar/publicar).
- Body ejemplo:
```json
{
  "status": "approved",
  "isPublished": true
}
```

### `DELETE /api/reviews/admin/:id`
- Acceso: `Privado Admin`
- Propósito: eliminar reseña.

## Leads (Solicitudes de desarrollo)

### `POST /api/leads`
- Acceso: `Público`
- Propósito: formulario de contacto/solicitud de desarrollo sin login.
- Body:
```json
{
  "name": "Carlos Ruiz",
  "email": "carlos@empresa.com",
  "company": "Empresa XYZ",
  "phone": "+57 3000000000",
  "projectType": "Web App",
  "budget": "USD 5k-10k",
  "message": "Necesitamos un sistema interno de gestión."
}
```

### `GET /api/leads/admin/list`
- Acceso: `Privado Admin`
- Propósito: listar solicitudes.
- Query opcional: `status=new|contacted|qualified|closed`

### `GET /api/leads/admin/:id`
- Acceso: `Privado Admin`
- Propósito: ver detalle de una solicitud.

### `PUT /api/leads/admin/:id`
- Acceso: `Privado Admin`
- Propósito: actualizar solicitud o estado comercial.
- Body ejemplo:
```json
{
  "status": "contacted"
}
```

### `DELETE /api/leads/admin/:id`
- Acceso: `Privado Admin`
- Propósito: eliminar solicitud.

## Uploads y formatos

- Las rutas de imagen usan Data URL base64 (`data:image/png;base64,...`).
- Formatos permitidos: `jpg`, `png`, `webp`.
- Tamaño máximo por archivo: configurado por `S3_MAX_FILE_SIZE_MB`.

## Recomendación de uso frontend

- Flujo admin:
  - `login` -> gestionar proyectos/reseñas/leads con cookie de sesión.
- Flujo público:
  - listar `projects` y `reviews`.
  - enviar `reviews` y `leads` sin autenticación.
