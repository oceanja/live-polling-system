import { Request, Response } from "express";
import { PollService } from "../services/poll.service";
import { io } from "../../socket";

export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const { pollId, optionId, studentId } = req.body;

    if (!pollId || !optionId || !studentId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const results = await PollService.submitVote({ pollId, optionId, studentId });
    io.emit("VOTE_UPDATE", results);

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
