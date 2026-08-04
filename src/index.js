// ============================================================
// index.js (server) — Punto de entrada del backend Express
// ============================================================
// FLUJO GENERAL DE LA APP:
//   Petición HTTP (fetch del frontend, Vite proxy /api → :3002)
//   → Express (este archivo)
//   → routers (/api/auth, /api/users, /api/tasks)
//   → controllers (lógica de negocio)
//   → models (SQL contra MySQL vía pool de database.js)
//   → respuesta JSON de vuelta al frontend
// ============================================================

// Carga las variables del archivo .env (DB_HOST, DB_USER, DB_PASSWORD...)
// Viene de: scripts/setup-env.js lo crea en npm install. Si faltan, la BD no conecta.
require('dotenv').config();

// Importa Express (framework HTTP) y CORS (permite peticiones de otros orígenes)
// El frontend corre en otro puerto (5173), por eso CORS es necesario.
const express = require('express');
const cors = require('cors');

// testConnection: verifica que MySQL responda (viene de config/database.js)
// runSeed: inserta 5 usuarios de prueba si la tabla está vacía (viene de database/seed.js)
const { testConnection } = require('./config/database');
const { runSeed } = require('./database/seed');

// Importa los 3 routers: cada uno trae sus endpoints definidos
// Vienen de: src/routes/*.routes.js
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const taskRoutes = require('./routes/task.routes');

// getDashboard: estadísticas globales (total, por estado, por usuario)
// Viene de: controllers/task.controller.js → models/task.model.js → SQL agregado
const taskController = require('./controllers/task.controller');

// Crea la aplicación Express y define el puerto (del .env o 3002 por defecto)
const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares globales: CORS abre la API a cualquier origen, express.json() parsea el body JSON
app.use(cors());
app.use(express.json());

// MONTAJE DE RUTAS: cada petición /api/* se redirige a su router
// /api/auth/*  → auth.routes.js  → auth.controller.js
// /api/users/* → user.routes.js  → user.controller.js
// /api/tasks/* → task.routes.js  → task.controller.js
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// GET /api/dashboard — Petición directa: index.js → taskController.getDashboard
// → TaskModel.getDashboard (COUNTs y GROUP BY) → JSON con estadísticas
app.get('/api/dashboard', taskController.getDashboard);

// GET /api — Health check básico: prueba que el servidor responde
app.get('/api', (req, res) => {
  res.json({ message: 'API REST - Gestión de Tareas v3.0', status: 'running' });
});

// ============================================================
// start — Secuencia de arranque del servidor
// FLUJO: start() → testConnection (¿hay MySQL?) → runSeed (tablas + datos)
// → app.listen (recibe peticiones en el puerto PORT)
// Si la BD no responde, el servidor NO arranca y muestra cómo solucionarlo.
// ============================================================
async function start() {
  try {
    // 1. Verifica conexión a MySQL (pool.getConnection + SELECT 1)
    // Viene de: config/database.js → testConnection()
    await testConnection();
    // 2. Crea las tablas si no existen e inserta 5 usuarios si la tabla está vacía
    // Viene de: database/seed.js → runSeed() → initDatabase() + INSERTs
    const seeded = await runSeed();
    console.log('Conexión a la base de datos exitosa');
    console.log(seeded
      ? 'Datos de prueba sembrados (5 usuarios)'
      : 'Base de datos lista (usuarios ya existentes)');
  } catch (err) {
    // Si la BD no está o las credenciales fallan: imprime el error y se detiene
    // La solución es ejecutar: npm run db:init (crea BD, usuario y tablas)
    console.error('ERROR: No se pudo conectar a la base de datos.');
    console.error('Revise las variables de entorno en .env y ejecute la primera vez: npm run db:init');
    console.error(err.message);
    process.exit(1); // Termina el proceso: sin BD no hay servidor
  }

  // 3. Inicia el servidor en todas las interfaces de red (0.0.0.0)
  // Desde aquí el frontend (Vite, puerto 5173) puede consumir la API
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Ejecuta el arranque al iniciar el proceso (node src/index.js / npm run dev)
start();
