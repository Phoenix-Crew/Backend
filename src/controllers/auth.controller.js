import { UserModel } from "../models/user.model.js";

// =================================================================
// [B2 - Stiven] Refactorizar para usar modelos con BD
// =================================================================
// login depende de UserModel.findByEmail — cuando B1 migre UserModel
// a BD, este controlador funcionará sin cambios.
// =================================================================

const ok = (res, data, message = "Operación exitosa", status = 200) =>
  res.status(status).json({ success: true, message, data, errors: [] });

const fail = (res, message = "Error", status = 500, errors = []) =>
  res.status(status).json({ success: false, message, data: null, errors });

export const login = (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return fail(res, "Email y contraseña son obligatorios", 400);
    }

    const user = UserModel.findByEmail(email);
    if (!user || user.password !== password) {
      return fail(res, "Credenciales inválidas", 401);
    }

    const { password: _, ...safeUser } = user;
    ok(res, safeUser, "Inicio de sesión exitoso");
  } catch (error) {
    fail(res, "Error al iniciar sesión");
  }
};
