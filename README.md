# API CardenasLabs

Backend REST en Node.js + Express + MongoDB para el ecosistema [CardenasLabs](https://cardenaslabs.com/). Incluye autenticación, gestión de proyectos, reseñas, solicitudes de desarrollo (leads), retos, cotizaciones y un asistente de IA.

## Funcionalidades

Todas las rutas cuelgan de `/api` (hay un `GET /api/health`).

| Módulo | Ruta base | Qué ofrece |
|---|---|---|
| Autenticación | `/api/auth` | Registro, login, logout, recuperación y restablecimiento de contraseña, verificación de email, inicio de sesión con LinkedIn y `GET /me` |
| Usuarios | `/api/users` | Actualización de perfil y contraseña; CRUD de usuarios para administradores |
| Proyectos | `/api/projects` | Listado y detalle públicos; CRUD administrativo |
| Reseñas | `/api/reviews` | Listado público, envío, moderación y publicación en LinkedIn |
| Leads | `/api/leads` | Envío público de solicitudes; gestión administrativa |
| Retos | `/api/challenges` | Retos para clientes y desarrolladores; gestión administrativa |
| Cotizaciones | `/api/quotations` | Consulta pública por slug, descarga en PDF y gestión administrativa |
| IA | `/api/ai` | `POST /chat`: asistente basado en Gemini |

Documentación detallada en este repositorio:

- [`architecture.md`](architecture.md): propósito de cada carpeta y archivo.
- [`routes-explained.md`](routes-explained.md): guía de rutas con ejemplos.

## Tecnologías

Node.js · Express 4 · MongoDB (Mongoose) · JWT · bcryptjs · express-validator · helmet · express-rate-limit · Nodemailer · AWS S3 y Secrets Manager · Google Gemini · Puppeteer

## Requisitos

- Node.js (versión LTS reciente)
- Una instancia de MongoDB accesible
- Credenciales de los servicios que uses (SMTP, AWS S3, Gemini, LinkedIn)

## Instalación

```bash
git clone https://github.com/Ancar2/api_cardenasLABS.git
cd api_cardenasLABS
npm install
```

## Configuración

Copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env
```

[`.env.example`](.env.example) documenta cada variable (`PORT`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `SMTP_*`, `AWS_*`, `GEMINI_*`, `LINKEDIN_*`, entre otras). En producción las variables se pueden cargar desde AWS Secrets Manager mediante `AWS_SECRETS_MANAGER_SECRET_ID`.

## Ejecución

```bash
npm run dev     # desarrollo, con recarga (node --watch)
npm start       # producción
npm run check   # comprobación de sintaxis de los archivos principales
```

El servidor escucha en el puerto definido en `PORT` (5001 por defecto).

## Estructura del proyecto

```text
config/        Conexión a MongoDB, carga de entorno y cliente S3
controllers/   Lógica de cada endpoint
middleware/    Autenticación, validación y manejo de errores
models/        Esquemas de Mongoose
routes/        Definición de rutas por módulo
services/      Email, subida a S3 y cliente de Gemini
validators/    Reglas de validación de entrada
utils/         Utilidades compartidas
```

## Autor

Andrés Cárdenas ([Ancar](https://github.com/Ancar2)) · [cardenaslabs.com](https://cardenaslabs.com/)
