import { Router } from "express";
import {
  getActivePoll,
  createPoll,
  getPollResults,
} from "../controllers/poll.controller";

const router = Router();

router.get("/active", getActivePoll);
router.post("/create", createPoll);


router.get("/:pollId/results", getPollResults);


router.post("/force-end", async (_req, res) => {
  const redis = (await import("../config/redis")).default;
  await redis.del("active_poll");
  res.json({ success: true });
});

export default router;
