import { Request, Response } from "express";
import { PollService } from "../services/poll.service";

export const getActivePoll = async (_req: Request, res: Response) => {
  try {
    const data = await PollService.getActivePoll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch active poll" });
  }
};

export const createPoll = async (req: Request, res: Response) => {
  try {
    const { question, options, duration } = req.body;

    if (!question || !options || !duration) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const safeDuration = Math.min(duration, 60);

const poll = await PollService.createPoll({
  question,
  options,
  duration: safeDuration,
});


    res.json(poll);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getPollResults = async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;

    const results = await PollService.getPollResults(pollId);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch poll results" });
  }
};


