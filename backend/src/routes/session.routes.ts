import { Router } from "express";
import {
  createSession,
  listSessions,
  joinSession,
  getSession,
  endSession,
  getReport,
} from "../controllers/session.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth); // every session route requires a logged-in user

router.post("/", requireRole("TEACHER"), createSession);
router.get("/", requireRole("TEACHER"), listSessions);
router.post("/join", joinSession);
router.get("/:id", getSession);
router.post("/:id/end", requireRole("TEACHER"), endSession);
router.get("/:id/report", getReport);

export default router;
