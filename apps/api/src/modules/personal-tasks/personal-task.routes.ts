import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
  getCalendar,
  setReminder,
} from "./personal-task.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", create);
router.get("/", getAll);
router.get("/calendar/:year/:month", getCalendar);
router.get("/:id", getOne);
router.patch("/:id", update);
router.delete("/:id", remove);
router.post("/:id/remind", setReminder);

export default router;
