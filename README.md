# Backend — API REST Gestión de Tareas

API REST con Express para la gestión de tareas y usuarios, con base de datos MySQL.

## Requisitos

- Node.js 18+
- MySQL 8+ (o MariaDB)
- npm

## Instalación

```bash
npm install
```

## Configuración de la base de datos

### 1. Crear la base de datos

Ejecuta el script `src/database/init.sql` (crea la BD `gestion_tareas`, el usuario `app_user` y las tablas `users`, `tasks` y `task_users`):

```bash
mysql -u root -p < src/database/init.sql
```

### 2. Variables de entorno

Copia el archivo `.env.example` como `.env` y completa los valores según tu entorno:

```bash
cp .env.example .env
```

### 3. Variables disponibles

| Variable       | Descripción                                  | Valor por defecto |
| -------------- | -------------------------------------------- | ----------------- |
| `PORT`         | Puerto del servidor Express                  | `3002`            |
| `DB_HOST`      | Host de la base de datos                     | `localhost`       |
| `DB_PORT`      | Puerto de la base de datos (3306 en MySQL)   | `3306`            |
| `DB_USER`      | Usuario de la base de datos                  | `app_user`        |
| `DB_PASSWORD`  | Contraseña del usuario de la base de datos   | *(obligatorio)*   |
| `DB_NAME`      | Nombre de la base de datos                   | `gestion_tareas`  |

Ejemplo de `.env`:

```env
PORT=3002

DB_HOST=localhost
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD="#ADSO_node"
DB_NAME=gestion_tareas
```

> El archivo `.env` no se versiona. Crea el tuyo a partir de `.env.example`.

## Ejecución

El servidor solo arranca si la conexión a la base de datos es exitosa. Si falla, muestra el error y se detiene.

```bash
npm start        # Producción
npm run dev      # Desarrollo (reinicio automático con --watch)
```

## Estructura

```
src/
├── config/database.js   # Pool de conexión a MySQL
├── controllers/         # Lógica de negocio por endpoint
├── database/init.sql    # Script de creación de la BD y tablas
├── models/              # Capa de persistencia
└── routes/              # Definición de rutas
```

## Endpoints

- `GET /api` — Health check
- `GET /api/dashboard` — Estadísticas globales
- `/api/auth` — Autenticación
- `/api/users` — CRUD de usuarios
- `/api/tasks` — CRUD de tareas
