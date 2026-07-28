import { UserModel } from "../models/user.model.js";

// =================================================================
// [B2 - Stiven] Refactorizar para usar modelos con BD
// =================================================================
// Igual que task.controller: los controladores ya están limpios.
// Cuando B1 migre UserModel a BD, esto funciona automáticamente.
// =================================================================

const ok = (res, data, message = "Operación exitosa", status = 200) =>
  res.status(status).json({ success: true, message, data, errors: [] });

const fail = (res, message = "Error", status = 500, errors = []) =>
  res.status(status).json({ success: false, message, data: null, errors });

export const getAll = (req, res) => {
  try {
    const users = UserModel.findAll();
    ok(res, users, "Lista de usuarios");
  } catch (error) {
    fail(res, "Error al obtener usuarios");
  }
};

export const getById = (req, res) => {
  try {
    const user = UserModel.findById(req.params.id);
    if (!user) return fail(res, `Usuario con ID ${req.params.id} no encontrado`, 404);
    ok(res, user, "Usuario encontrado");
  } catch (error) {
    fail(res, "Error al buscar usuario");
  }
};

export const create = (req, res) => {
  try {
    const { name, email, rol, password } = req.body;
    if (!name || !name.trim()) return fail(res, "El nombre es obligatorio", 400);
    if (!email || !email.trim()) return fail(res, "El email es obligatorio", 400);
    if (!rol || !rol.trim()) return fail(res, "El rol es obligatorio", 400);
    if (!password || password.length < 6) {
      return fail(res, "La contraseña debe tener al menos 6 caracteres", 400);
    }

    const newUser = UserModel.create({ name, email, rol, password, ficha: req.body.ficha });
    ok(res, newUser, "Usuario creado correctamente", 201);
  } catch (error) {
    fail(res, "Error al crear usuario");
  }
};

export const update = (req, res) => {
  try {
    const { name, email, rol } = req.body;
    if (name !== undefined && !name.trim()) return fail(res, "El nombre no puede estar vacío", 400);
    if (email !== undefined && !email.trim()) return fail(res, "El email no puede estar vacío", 400);
    if (rol !== undefined && !rol.trim()) return fail(res, "El rol no puede estar vacío", 400);

    const updated = UserModel.update(req.params.id, req.body);
    if (!updated) return fail(res, `Usuario con ID ${req.params.id} no encontrado`, 404);
    ok(res, updated, "Usuario actualizado correctamente");
  } catch (error) {
    fail(res, "Error al actualizar usuario");
  }
};

export const remove = (req, res) => {
  try {
    const deleted = UserModel.delete(req.params.id);
    if (!deleted) return fail(res, `Usuario con ID ${req.params.id} no encontrado`, 404);
    ok(res, { id: req.params.id }, "Usuario eliminado correctamente");
  } catch (error) {
    fail(res, "Error al eliminar usuario");
  }
};

export const toggleStatus = (req, res) => {
  try {
    const { active } = req.body;
    if (typeof active !== "boolean") {
      return fail(res, "El campo active debe ser booleano", 400);
    }
    const user = UserModel.toggleStatus(req.params.id, active);
    if (!user) return fail(res, `Usuario con ID ${req.params.id} no encontrado`, 404);
    ok(res, user, active ? "Usuario activado" : "Usuario desactivado");
  } catch (error) {
    fail(res, "Error al cambiar estado del usuario");
  }
};
