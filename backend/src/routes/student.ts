import { Router } from "express";

const router = Router();

router.post("/join", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  return res.json({
    success: true,
    student: {
      id: Date.now(),
      name,
    },
  });
});

export default router;
