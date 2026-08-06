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

-- Esta tabla puente guarda quién está asignado a cada tarea y permite la relación muchos-a-muchos
CREATE TABLE IF NOT EXISTS task_users ( -- CREATE TABLE crea la tabla, IF NOT EXISTS solo la crea si no existe todavía
    task_id INT NOT NULL,             -- columna con el id de la tarea asignada, tipo INT y NOT NULL obliga a que siempre tenga valor
    user_id INT NOT NULL,             -- columna con el id del usuario asignado, tipo INT y NOT NULL obliga a que siempre tenga valor
    PRIMARY KEY (task_id, user_id),   -- clave compuesta por ambas columnas, impide asignar dos veces el mismo usuario a la misma tarea
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE, -- llave foránea, task_id apunta a id de tasks, con CASCADE la asignación se borra o actualiza junto con la tarea
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE -- llave foránea, user_id apunta a id de users, con CASCADE la asignación se borra o actualiza junto con el usuario
);
