// =================================================================
// [B3 - Brian] Configuración de conexión a base de datos
// =================================================================
// Instalar driver: npm install mysql2 (o pg para PostgreSQL)
// 
// Ejemplo con mysql2:
//
//   import mysql from "mysql2/promise";
//
//   const pool = mysql.createPool({
//     host: process.env.DB_HOST || "localhost",
//     port: process.env.DB_PORT || 3306,
//     user: process.env.DB_USER || "app_user",
//     password: process.env.DB_PASSWORD || "#ADSO_node",
//     database: process.env.DB_NAME || "gestion_tareas",
//     waitForConnections: true,
//     connectionLimit: 10,
//   });
//
//   export default pool;
//
// =================================================================