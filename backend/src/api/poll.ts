import { Router } from "express";

const router = Router();


let currentPollState = {
  state: "WAITING", // WAITING | ACTIVE | RESULT
  question: null,
};

router.get("/current", (req, res) => {
  res.json({
    success: true,
    poll: currentPollState,
  });
});

export default router;
