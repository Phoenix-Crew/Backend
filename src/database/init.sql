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

-- Este comentario SQL marca la tabla puente "task_users": guarda quién está asignado a cada tarea y permite la relación muchos-a-muchos, donde una tarea tiene varios usuarios y un usuario varias tareas
CREATE TABLE IF NOT EXISTS task_users ( -- "CREATE TABLE" crea la tabla; "IF NOT EXISTS" solo la crea si no existe todavía; "task_users" es el nombre de la tabla puente; el paréntesis abre la lista de columnas
    task_id INT NOT NULL,             -- "task_id" es la columna con el id de la tarea asignada; "INT" es el tipo entero y "NOT NULL" indica que siempre debe tener valor
    user_id INT NOT NULL,             -- "user_id" es la columna con el id del usuario asignado; "INT" es entero y "NOT NULL" obliga a que siempre tenga valor
    PRIMARY KEY (task_id, user_id),   -- "PRIMARY KEY" define la clave compuesta por ambas columnas: impide asignar dos veces el mismo usuario a la misma tarea
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE, -- "FOREIGN KEY" crea la llave foránea: "task_id" apunta a "id" de "tasks"; "ON DELETE CASCADE" borra la asignación si se borra la tarea y "ON UPDATE CASCADE" la actualiza si cambia el id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE -- la segunda llave foránea: "user_id" apunta a "id" de "users"; con "CASCADE" la asignación se elimina o actualiza junto con el usuario
); -- el paréntesis cierra las columnas y el punto y coma termina la sentencia
