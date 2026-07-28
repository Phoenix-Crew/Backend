import { Router } from "express";
import {
  getAll, getById, create, update, remove, toggleStatus,
} from "../controllers/user.controller.js";

const router = Router();

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getById);
router.put("/:id", update);
router.delete("/:id", remove);
router.patch("/:id/status", toggleStatus);

export default router;
