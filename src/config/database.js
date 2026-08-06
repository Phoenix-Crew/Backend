const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_tareas',
  waitForConnections: true,
  connectionLimit: 10,
});

async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      rol VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      ficha VARCHAR(50) DEFAULT '3315656'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('Pendiente', 'En progreso', 'Completada') DEFAULT 'Pendiente',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Este comentario marca la tabla puente "task_users": guarda la asignación de un usuario a una tarea y permite la relación muchos-a-muchos entre tareas y usuarios
  await pool.query(` // "await" espera; "pool.query" ejecuta la sentencia SQL sobre el pool de conexiones; el acento grave abre la sentencia de creación de la tabla
    CREATE TABLE IF NOT EXISTS task_users ( // "CREATE TABLE" crea la tabla; "IF NOT EXISTS" solo la crea si no existe todavía; "task_users" es el nombre de la tabla puente; el paréntesis abre la lista de columnas
      task_id INT NOT NULL,             // "task_id" es la columna que guarda el id de la tarea a la que se asigna; "INT" es el tipo entero y "NOT NULL" indica que siempre debe tener valor
      user_id INT NOT NULL,             // "user_id" es la columna que guarda el id del usuario asignado; "INT" es entero y "NOT NULL" obliga a que siempre tenga valor
      PRIMARY KEY (task_id, user_id),   // "PRIMARY KEY" define la clave principal compuesta por ambas columnas: así se garantiza que un usuario no se asigne dos veces a la misma tarea
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE, // "FOREIGN KEY" crea una llave foránea: "task_id" hace referencia a la columna "id" de la tabla "tasks"; "ON DELETE CASCADE" borra la asignación si se borra la tarea y "ON UPDATE CASCADE" la actualiza si cambia el id
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE // la segunda llave foránea: "user_id" hace referencia a "id" de "users"; con "CASCADE" la asignación se elimina o actualiza junto con el usuario
    ) // el paréntesis cierra la lista de columnas de la tabla
  `); // el acento grave cierra la sentencia SQL y el paréntesis cierra la llamada a "query"
}

module.exports = { pool, testConnection, initDatabase };
