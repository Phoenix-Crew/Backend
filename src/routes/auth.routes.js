// ============================================================
// auth.routes.js — Rutas de autenticacion
// ============================================================
// ORIGEN: montado en src/index.js como app.use('/api/auth', authRoutes)
// DESTINO: cada ruta delega en auth.controller.js → UserModel (MySQL)
//
// Endpoints:
//   POST /api/auth/login → authController.login
// ============================================================

// Crea un Router de Express (sub-conjunto de rutas montable)
const router = require('express').Router();
// Importa el controlador de autenticación (lógica de negocio)
// Viene de: controllers/auth.controller.js
const authController = require('../controllers/auth.controller');

// POST /api/auth/login — Inicia sesion
// FLUJO: fetch POST /api/auth/login → authController.login
// → UserModel.findByEmail → SELECT en MySQL → valida → JSON
// (JWT y hashing quedaron pendientes de integrar)
router.post('/login', authController.login);

// EXPORTA el router: lo consume src/index.js
module.exports = router;
