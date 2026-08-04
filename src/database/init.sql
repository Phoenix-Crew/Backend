-- ============================================================
-- Script de inicialización de la base de datos
-- Base de datos: gestion_tareas
-- EJECUTAR CON: npm run db:init (script scripts/db-init.js)
--   O manualmente: mysql -u root -p < init.sql
-- IDEMPOTENTE Y AUTO-CURATIVO: se puede ejecutar las veces que
-- sea necesario sin errores (IF NOT EXISTS + ALTER USER).
-- ============================================================

-- 1. USUARIO DE LA APP
-- Crea el usuario grupo4 si no existe (la app se conecta con él, ver .env)
CREATE USER IF NOT EXISTS 'grupo4'@'localhost' IDENTIFIED BY 'grupo4';

-- Repara la contraseña si el usuario YA existía con otra distinta
-- (esto evita el error "Access denied ... using password: YES" en otra PC)
ALTER USER 'grupo4'@'localhost' IDENTIFIED BY 'grupo4';

-- 2. BASE DE DATOS
-- Crea la BD si no existe (la app la usa: DB_NAME en el .env)
CREATE DATABASE IF NOT EXISTS gestion_tareas;

-- 3. PRIVILEGIOS
-- Da todos los permisos al usuario sobre todas las bases
-- (si ya están concedidos, db-init.js lo detecta y lo omite)
GRANT ALL PRIVILEGES ON *.* TO 'grupo4'@'localhost';

-- Aplica los cambios de privilegios inmediatamente
FLUSH PRIVILEGES;

-- 4. TABLAS
-- Selecciona la BD sobre la que se crean las tablas siguientes
USE gestion_tareas;

-- Tabla users: usuarios del sistema
-- (id autoincremental, email único, active activo por defecto, ficha por defecto 3315656)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    ficha VARCHAR(50) DEFAULT '3315656'
);

-- Tabla tasks: tareas (estado ENUM con los 3 estados que usa el frontend)
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Pendiente', 'En progreso', 'Completada') DEFAULT 'Pendiente',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla task_users: relación muchos-a-muchos entre tareas y usuarios.
-- Las FK con ON DELETE CASCADE borran asignaciones al borrar la tarea/usuario.
CREATE TABLE IF NOT EXISTS task_users (
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (task_id, user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
