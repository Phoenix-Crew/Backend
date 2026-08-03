// ============================================================
// auth.controller.js — Controlador de autenticacion
// ============================================================
// login consulta el usuario por email en la base de datos
// (pendiente de hashing + JWT).

const { UserModel } = require('../models');

// login — POST /api/auth/login — Valida credenciales contra la BD
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ message: 'Login pendiente de implementar', user: safeUser });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};