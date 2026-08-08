require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { testConnection } = require('./config/database');
const { runSeed } = require('./database/seed');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const taskRoutes = require('./routes/task.routes');

const taskController = require('./controllers/task.controller');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
// Cómo se lee: "App punto use, con express punto json."
app.use(express.json()); // Qué hace: convierte el body JSON (donde viaja assignedUsers) en objeto JavaScript

app.use('/api/auth', authRoutes);
// Cómo se lee: "App punto use, pasando /api/users y userRoutes como argumentos."
app.use('/api/users', userRoutes); // Qué hace: monta todas las rutas de usuarios, incluida la que usamos: GET /api/users/:userId/tasks
// Cómo se lee: "App punto use, pasando '/api/tasks' y taskRoutes como argumentos."
// Qué es: el punto de entrada del backend para el flujo "asignar tarea": aquí llega el POST /api/tasks que crea y asigna la tarea.
app.use('/api/tasks', taskRoutes);

// Cómo se lee: "App punto get, pasando '/api/dashboard' y taskController punto getDashboard."
app.get('/api/dashboard', taskController.getDashboard); // Qué hace: responde las estadísticas del panel
// Cómo se lee: "App punto get, pasando '/api' y una función con req y res."
app.get('/api', (req, res) => { // Qué hace: responde en la raíz con el estado de la API
  // Cómo se lee: "Res punto json pasando el objeto con el mensaje y el status."
  res.json({ message: 'API REST - Gestión de Tareas v3.0', status: 'running' }); // Qué hace: manda el JSON de bienvenida de la API
});

async function start() {
  try {
    await testConnection();
    const seeded = await runSeed();
    console.log('Conexión a la base de datos exitosa');
    console.log(seeded
      ? 'Datos de prueba sembrados (5 usuarios)'
      : 'Base de datos lista (usuarios ya existentes)');
  } catch (err) {
    console.error('ERROR: No se pudo conectar a la base de datos.');
    console.error('Revise las variables de entorno en .env y ejecute la primera vez: npm run db:init');
    console.error(err.message);
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

start();
