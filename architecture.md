# Backend Base Architecture

Este backend está diseñado como una base reutilizable para proyectos con Node.js + Express + MongoDB.

## Objetivo de esta estructura

- Separar responsabilidades por capas para escalar sin mezclar lógica.
- Tener autenticación, autorización y recuperación de contraseña desde el inicio.
- Mantener una forma de respuesta y manejo de errores consistente.

## Estructura de carpetas

### `config/`
Propósito: configuración técnica de infraestructura.

- `db.js`
  - Qué hace: crea la conexión a MongoDB con `mongoose.connect`.
  - Por qué existe: centraliza la conexión a base de datos en un solo lugar, evitando repetir lógica en el arranque.

- `loadEnv.js`
  - Qué hace: carga `.env` localmente y, en producción, obtiene variables desde AWS Secrets Manager antes del arranque.
  - Por qué existe: permite separar secretos del servidor y usar una estrategia segura de configuración en despliegues reales.

- `s3.js`
  - Qué hace: crea y configura el cliente de AWS S3.
  - Por qué existe: centraliza configuración de infraestructura para subida de imágenes.

### `controllers/`
Propósito: orquestar la lógica de cada endpoint (recibir request, usar modelos/servicios, responder).

- `authController.js`
  - Qué hace: registro, login, logout, `me`, forgot/reset password.
  - Por qué existe: agrupa todo el flujo de autenticación y mantiene rutas limpias.

- `userController.js`
  - Qué hace: CRUD administrativo de usuarios, actualización de perfil y contraseña.
  - Por qué existe: separa la gestión de usuarios de la autenticación para mantener claridad.

- `projectController.js`
  - Qué hace: CRUD de proyectos (realizados, en progreso o futuros), publicación y gestión de imágenes.
  - Por qué existe: encapsula la lógica del portafolio profesional de la empresa.

- `reviewController.js`
  - Qué hace: recepción pública de reseñas y moderación admin para publicación.
  - Por qué existe: soporta prueba social con flujo de aprobación.

- `leadController.js`
  - Qué hace: recepción pública de solicitudes de desarrollo y gestión admin de pipeline comercial.
  - Por qué existe: separa el funnel comercial del resto de dominios.

- `challengeController.js`
  - Qué hace: gestiona retos públicos por audiencia (`client`/`developer`), opciones visuales con imagen, clave correcta y respuestas sin login.
  - Por qué existe: habilita dinámica de interacción con reglas de negocio (máximo 3 retos activos por audiencia).

### `middleware/`
Propósito: validaciones y lógica transversal antes/después de controladores.

- `authMiddleware.js`
  - Qué hace: protege rutas con JWT (cookie o Bearer) y valida rol admin.
  - Por qué existe: evita duplicar control de acceso en cada endpoint.

- `errorMiddleware.js`
  - Qué hace: maneja 404 y errores globales (incluye cast/duplicados/validación de Mongoose).
  - Por qué existe: unifica errores en un formato predecible para frontend y debugging.

- `validateMiddleware.js`
  - Qué hace: procesa errores de `express-validator`.
  - Por qué existe: permite declarar reglas en rutas y manejar errores de validación de forma centralizada.

### `models/`
Propósito: definir entidades de base de datos.

- `user.model.js`
  - Qué hace: esquema de usuario, hash de contraseña, comparación de contraseña, token de reset.
  - Por qué existe: encapsula reglas de datos y seguridad del usuario dentro del modelo.

- `project.model.js`
  - Qué hace: almacena proyectos con dominio, descripción, stack, estado y capturas con título.
  - Por qué existe: modela los casos de uso de proyectos realizados y roadmap.

- `review.model.js`
  - Qué hace: almacena reseñas de clientes, foto, estrellas y estado de moderación/publicación.
  - Por qué existe: habilita gestión de reputación con control editorial.

- `lead.model.js`
  - Qué hace: almacena formularios de solicitud de desarrollo y estado comercial.
  - Por qué existe: permite seguimiento de leads desde el panel admin.

- `challenge.model.js`
  - Qué hace: almacena retos por audiencia con estado activo/inactivo.
  - Por qué existe: modela el catálogo de retos disponibles en la web.

- `challengeResponse.model.js`
  - Qué hace: almacena respuestas de retos con `username` y `answer`.
  - Por qué existe: separa las respuestas del reto y permite auditoría/consulta admin.

### `routes/`
Propósito: mapa HTTP de la API.

- `routes.js`
  - Qué hace: funciona como agregador principal de rutas por dominio.
  - Por qué existe: centraliza el montaje de rutas sin mezclar definición de endpoints.

- `auth.routes.js`
  - Qué hace: define endpoints de autenticación (`/register`, `/login`, `/logout`, `/forgotpassword`, `/resetpassword/:resettoken`, `/me`).
  - Por qué existe: encapsula el dominio de autenticación en un módulo dedicado.

- `user.routes.js`
  - Qué hace: define endpoints de usuarios (perfil, cambio de contraseña y CRUD admin).
  - Por qué existe: encapsula el dominio de usuarios y simplifica mantenimiento.

- `project.routes.js`
  - Qué hace: define endpoints públicos y admin para portafolio y subida de imágenes de proyectos.
  - Por qué existe: separa la gestión de proyectos como dominio independiente.

- `review.routes.js`
  - Qué hace: define endpoints para envío público de reseñas y moderación admin.
  - Por qué existe: desacopla flujo público de validación editorial.

- `lead.routes.js`
  - Qué hace: define endpoints para formulario público de solicitudes y su gestión admin.
  - Por qué existe: aísla la capa de captación comercial del resto del API.

- `challenge.routes.js`
  - Qué hace: define endpoints públicos para listar/responder retos y endpoints admin para gestión.
  - Por qué existe: encapsula el dominio de retos como módulo independiente.

### `validators/`
Propósito: centralizar y reutilizar reglas de validación de entrada.

- `authValidators.js`
  - Qué hace: reglas de validación para login, registro, forgot/reset password.
  - Por qué existe: evita mezclar reglas de auth dentro de rutas y facilita mantenimiento.

- `userValidators.js`
  - Qué hace: reglas de validación para endpoints de usuario (perfil, password, admin CRUD).
  - Por qué existe: separa validaciones por dominio y permite reusar reglas como `mongoIdValidation`.

- `projectValidators.js`
  - Qué hace: reglas de validación para CRUD de proyectos y subida de imágenes.
  - Por qué existe: mantiene contratos de entrada consistentes para el portafolio.

- `reviewValidators.js`
  - Qué hace: reglas para envío de reseñas y moderación.
  - Por qué existe: protege calidad de datos en feedback de clientes.

- `leadValidators.js`
  - Qué hace: reglas para solicitud pública y actualización admin de leads.
  - Por qué existe: asegura datos mínimos para seguimiento comercial.

- `challengeValidators.js`
  - Qué hace: reglas para crear/editar retos, filtrar listados y registrar respuestas.
  - Por qué existe: garantiza calidad de datos y cumplimiento de contratos del módulo de retos.

### `services/`
Propósito: integraciones externas.

- `emailService.js`
  - Qué hace: envía correos SMTP para recuperación de contraseña.
  - Por qué existe: desacopla servicios de terceros de los controladores.

- `s3UploadService.js`
  - Qué hace: valida y sube imágenes en base64 a AWS S3.
  - Por qué existe: centraliza la integración de almacenamiento para proyectos y reseñas.

### `utils/`
Propósito: helpers reutilizables y neutrales al dominio.

- `generateToken.js`
  - Qué hace: crea JWT con expiración configurable.
  - Por qué existe: evita repetir firma de token en controladores.

- `sendResponse.js`
  - Qué hace: respuesta estándar `{ success, data, message }`.
  - Por qué existe: consistencia de contrato de API en todo el proyecto.

## Archivos en raíz

- `index.js`
  - Qué hace: punto de entrada del servidor, carga configuración, conecta DB, configura middlewares, seguridad HTTP, compresión, rate limit y monta rutas.
  - Por qué existe: centraliza el bootstrap del backend.

- `package.json`
  - Qué hace: define dependencias, scripts (`dev`, `start`, `check`) y metadata del proyecto.
  - Por qué existe: contrato de ejecución/instalación del proyecto.

- `package-lock.json`
  - Qué hace: fija versiones exactas instaladas.
  - Por qué existe: builds reproducibles entre entornos.

- `.gitignore`
  - Qué hace: evita subir archivos locales/sensibles (`node_modules`, `.env`, etc.).
  - Por qué existe: seguridad y limpieza del repositorio.

- `.env`
  - Qué hace: variables reales del entorno local/servidor.
  - Por qué existe: separar secretos y configuración del código.

- `.env.example`
  - Qué hace: plantilla pública de variables requeridas, incluyendo CORS, rate limit, límites del API, AWS Secrets Manager y AWS S3.
  - Por qué existe: onboarding rápido sin exponer secretos.

- `architecture.md`
  - Qué hace: documenta arquitectura y razones de diseño.
  - Por qué existe: facilitar mantenimiento y crecimiento del proyecto.


## Convenciones recomendadas para mantener esta base genérica

- Toda lógica de negocio nueva entra en `controllers/` + `models/`.
- Toda validación de entrada se declara en `validators/`.
- Todo acceso externo (emails, pagos, storage, APIs) entra en `services/`.
- Mantener respuesta estándar con `sendResponse` para no romper clientes.
- Mantener configuraciones sensibles en `.env` y documentarlas en `.env.example`.
- En producción, preferir AWS Secrets Manager sobre secretos planos en archivos locales.
