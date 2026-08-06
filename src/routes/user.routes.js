const router = require('express').Router(); // "const" crea la constante; "router" es el enrutador de usuarios; "require" importa; "'express'" es la librería del servidor; "'.Router()'" crea el objeto que agrupa rutas
const userController = require('../controllers/user.controller'); // "const" crea; "userController" agrupa las funciones de control de usuarios; "require" importa el archivo del controlador

router.post('/',          userController.create); // "router.post" define POST; "'/'" es la raíz (POST /api/users); "userController.create" crea un usuario nuevo

router.get('/',           userController.getAll); // "router.get" define GET; "'/'" es la raíz (GET /api/users); "userController.getAll" devuelve todos los usuarios del sistema

router.get('/:userId/tasks', userController.getUserTasks); // "router.get" define GET; "'/:userId/tasks'" captura ":userId" de la URL y pide sus tareas (GET /api/users/:userId/tasks); "userController.getUserTasks" devuelve las tareas asignadas a ese usuario: es la ruta que llama la función "searchUser" del frontend para llenar la tabla con las tareas ya asignadas

router.get('/:id',        userController.getById); // "router.get" define GET; "'/:id'" captura el id (GET /api/users/:id); "userController.getById" devuelve un usuario

router.put('/:id',        userController.update); // "router.put" define PUT; "'/:id'" captura el id; "userController.update" actualiza el usuario

router.delete('/:id',     userController.remove); // "router.delete" define DELETE; "'/:id'" captura el id; "userController.remove" elimina el usuario

router.patch('/:id/status', userController.toggleStatus); // "router.patch" define PATCH; "'/:id/status'" captura el id y apunta al estado; "userController.toggleStatus" activa o inactiva el usuario

module.exports = router; // "module.exports" exporta; "router" queda listo para montarse en el index.js bajo la ruta /api/users
