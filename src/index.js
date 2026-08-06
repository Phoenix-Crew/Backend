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

app.use(cors()); // "app" es la aplicación Express; ".use" registra un middleware; "cors()" es el middleware que permite que el frontend (que corre en el puerto 5173) consuma esta API sin que el navegador lo bloquee
app.use(express.json()); // "app" es la aplicación; ".use" registra el middleware; "express.json()" parsea el body de las peticiones: es imprescindible porque ahí viaja el array "assignedUsers" de la tarea que envía el frontend

app.use('/api/auth', authRoutes); // "app.use" monta; "'/api/auth'" es el prefijo; "authRoutes" es el enrutador de autenticación: todas sus rutas quedan bajo /api/auth
app.use('/api/users', userRoutes); // "app.use" monta; "'/api/users'" es el prefijo; "userRoutes" es el enrutador de usuarios: incluye la ruta /api/users/:userId/tasks que consulta las tareas asignadas
app.use('/api/tasks', taskRoutes); // "app.use" monta; "'/api/tasks'" es el prefijo; "taskRoutes" es el enrutador de tareas: aquí llega el POST /api/tasks que crea la tarea y la asigna, junto con las rutas de asignar, listar y quitar usuarios

app.get('/api/dashboard', taskController.getDashboard); // "app.get" define una ruta GET; "'/api/dashboard'" es la ruta del panel de administración; "taskController.getDashboard" devuelve las estadísticas generales

app.get('/api', (req, res) => { // "app.get" define GET; "'/api'" es la raíz informativa; "(req, res)" recibe la petición y la respuesta; la llave abre la función
  res.json({ message: 'API REST - Gestión de Tareas v3.0', status: 'running' }); // "res.json" envía un JSON de bienvenida con el nombre de la API y el estado "running"
}); // la llave cierra la función

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
