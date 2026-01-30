import { Router } from "express";
import { submitAnswer } from "../controllers/answer.controller";

const router = Router();

router.post("/submit", submitAnswer);

export default router;