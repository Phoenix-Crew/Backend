import { Router } from "express";
import {
  getAll, getById, create, update, remove,
  updateStatus, assignUsers, getAssignedUsers,
  removeUserAssignment, filter,
} from "../controllers/task.controller.js";

const router = Router();

router.get("/filter", filter);
router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.patch("/:id", update);
router.patch("/:id/status", updateStatus);
router.delete("/:id", remove);
router.post("/:taskId/assign", assignUsers);
router.get("/:taskId/users", getAssignedUsers);
router.delete("/:taskId/users/:userId", removeUserAssignment);

export default router;
