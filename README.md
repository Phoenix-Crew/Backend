# Backend — API REST Gestión de Tareas

API REST con Express para la gestión de tareas y usuarios, con base de datos MySQL.

## Requisitos

- Node.js 18+
- MySQL 8+ (o MariaDB) corriendo en el puerto 3306
- npm

## Instalación rápida (otra PC)

```bash
git clone <url-del-repositorio>
cd Backend

npm install      # instala dependencias y genera .env automáticamente
npm run db:init  # SOLO la primera vez: crea la BD, el usuario grupo4 y las tablas
npm run dev
```

> `npm run db:init` pide el usuario y la contraseña **admin** de MySQL (ej: `root`).
> Alternativa sin prompt: `npm run db:init -- --user=root --password=tu_password`
> O con variables de entorno: `DB_ADMIN_USER=root DB_ADMIN_PASSWORD=tu_password npm run db:init`

## Qué hace cada comando

| Comando          | Descripción                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `npm install`    | Instala dependencias y copia `.env.example` → `.env` si no existe           |
| `npm run db:init`| Crea la BD `gestion_tareas`, el usuario `grupo4` y las tablas (idempotente) |
| `npm run dev`    | Inicia el servidor con reinicio automático                                  |
| `npm start`      | Inicia el servidor en producción                                            |
| `npm run seed`   | (Opcional) Sembrar datos de prueba manualmente                              |

## Variables de entorno

Copia el archivo `.env.example` como `.env` (o se genera solo con `npm install`) y completa los valores según tu entorno:

| Variable       | Descripción                                | Valor por defecto |
| -------------- | ------------------------------------------ | ----------------- |
| `PORT`         | Puerto del servidor Express                | `3002`            |
| `DB_HOST`      | Host de la base de datos                   | `localhost`       |
| `DB_PORT`      | Puerto de la base de datos (3306 en MySQL) | `3306`            |
| `DB_USER`      | Usuario de la base de datos                | `grupo4`          |
| `DB_PASSWORD`  | Contraseña del usuario de la base de datos | `grupo4`          |
| `DB_NAME`      | Nombre de la base de datos                 | `gestion_tareas`  |

Ejemplo de `.env`:

```env
PORT=3002

DB_HOST=localhost
DB_PORT=3306
DB_USER=grupo4
DB_PASSWORD="grupo4"
DB_NAME=gestion_tareas
```

> El archivo `.env` no se versiona. Crea el tuyo a partir de `.env.example`.

## Comportamiento al iniciar

El servidor, al iniciar: valida la conexión, **crea las tablas automáticamente si no existen** y **siembra 5 usuarios de prueba si la tabla está vacía**. Si no hay BD disponible, muestra el error y se detiene.

## Solución de problemas

| Error                                                     | Causa                                                            | Solución                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| `Access denied for user 'grupo4'@'localhost' (using password: NO)` | El `.env` no existe o está incompleto          | Ejecutar `npm install` o copiar `.env.example` a `.env` |
| `Access denied for user 'grupo4'@'localhost' (using password: YES)` | Contraseña de `grupo4` incorrecta en el `.env` | Ejecutar `npm run db:init` (repara la contraseña) |
| `ERROR: No se pudo conectar a la base de datos`           | MySQL no está corriendo o credenciales mal                       | Verificar que MySQL escuche en el puerto 3306 y ejecutar `npm run db:init` |

## Estructura

```
src/
├── config/database.js   # Pool de conexión a MySQL + initDatabase (auto-crea tablas)
├── controllers/         # Lógica de negocio por endpoint
├── database/init.sql    # Script de creación de la BD, usuario y tablas
├── database/seed.js     # Seed idempotente de usuarios de prueba
├── models/              # Capa de persistencia (user.model.js, task.model.js)
└── routes/              # Definición de rutas
scripts/
├── db-init.js           # npm run db:init — ejecuta init.sql (multi-plataforma)
└── setup-env.js         # postinstall — crea .env desde .env.example
```

## Endpoints

- `GET /api` — Health check
- `GET /api/dashboard` — Estadísticas globales
- `/api/auth` — Autenticación
- `/api/users` — CRUD de usuarios
- `/api/tasks` — CRUD de tareas
