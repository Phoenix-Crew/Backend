// ============================================================
// auth.controller.js — Controlador de autenticacion
// ============================================================
// [B2 - Stiven] Verificar login con BD real
// Depende de readDB() → cuando models/index.js use BD,
// debe seguir funcionando igual.
// ============================================================

const { readDB } = require('../models');

// login — POST /api/auth/login — Valida credenciales (pendiente de hashing + JWT)
exports.login = (req, res) => {
  const { email, password } = req.body;
  const { users } = readDB();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });
  res.json({ message: 'Login pendiente de implementar', user });
};
