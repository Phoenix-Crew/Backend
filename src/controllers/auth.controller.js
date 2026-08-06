const { UserModel } = require('../models');

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
