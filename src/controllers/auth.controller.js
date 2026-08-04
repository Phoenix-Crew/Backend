// ============================================================
// auth.controller.js — Controlador de autenticacion
// ============================================================
// FLUJO: POST /api/auth/login (auth.routes.js)
// → este controlador → UserModel.findByEmail (SELECT en MySQL)
// → valida credenciales → responde JSON
// (pendiente: hashing de contraseña + JWT)
// ============================================================

// Importa UserModel desde models/index.js (que exporta user.model.js)
// Es la capa de persistencia: ejecuta el SQL contra MySQL
const { UserModel } = require('../models');

// ============================================================
// login — POST /api/auth/login
// ORIGEN: auth.routes.js (router.post('/login', authController.login))
// DESTINO: UserModel.findByEmail → SELECT * FROM users WHERE email = ?
// QUÉ HACE: valida que vengan email y password, busca el usuario,
// compara la contraseña y responde el usuario (sin password)
// QUÉ DEVUELVE: JSON con el usuario o error 400/401/500
// ============================================================
exports.login = async (req, res) => {
  try {
    // Extrae email y password del body de la petición (express.json los parseó)
    const { email, password } = req.body;
    // Validación: si falta alguno, responde 400 sin tocar la BD
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    // Busca el usuario por email en MySQL (el único modelo que trae password)
    const user = await UserModel.findByEmail(email);
    // Si no existe o la contraseña no coincide: 401 (no autorizado)
    // NOTA: la comparación es texto plano; falta hashing (bcrypt) pendiente
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Quita el campo password del objeto antes de responder (seguridad)
    const { password: _, ...safeUser } = user;
    // Responde el usuario sin password (el login aún no genera token JWT)
    res.json({ message: 'Login pendiente de implementar', user: safeUser });
  } catch (error) {
    // Cualquier error inesperado (ej. BD caída) → 500 con el mensaje
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};
