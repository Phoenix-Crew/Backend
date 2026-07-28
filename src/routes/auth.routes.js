// ============================================================
// auth.routes.js — Rutas de autenticacion
// ============================================================

const router = require('express').Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/login — Inicia sesion y retorna token (pendiente de integracion)
router.post('/login', authController.login);

module.exports = router;
