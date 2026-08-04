-- Script de inicialización de la base de datos
-- Base de datos: gestion_tareas
-- Ejecutar con: npm run db:init
-- Idempotente y auto-curativo: se puede ejecutar las veces que sea necesario.

CREATE USER IF NOT EXISTS 'grupo4'@'localhost' IDENTIFIED BY 'grupo4';
ALTER USER 'grupo4'@'localhost' IDENTIFIED BY 'grupo4';

CREATE DATABASE IF NOT EXISTS gestion_tareas;

GRANT ALL PRIVILEGES ON *.* TO 'grupo4'@'localhost';
FLUSH PRIVILEGES;

USE gestion_tareas;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    ficha VARCHAR(50) DEFAULT '3315656'
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Pendiente', 'En progreso', 'Completada') DEFAULT 'Pendiente',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_users (
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (task_id, user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
