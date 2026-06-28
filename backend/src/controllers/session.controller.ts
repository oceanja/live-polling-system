import { Response } from "express";
import { SessionService } from "../services/session.service";
import { AuthedRequest } from "../middleware/auth";

export const createSession = async (req: AuthedRequest, res: Response) => {
  try {
    res.json(await SessionService.createSession(req.user!.id, req.body.title));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const listSessions = async (req: AuthedRequest, res: Response) => {
  try {
    res.json(await SessionService.listTeacherSessions(req.user!.id));
  } catch {
    res.status(500).json({ message: "Failed to load sessions" });
  }
};

export const joinSession = async (req: AuthedRequest, res: Response) => {
  try {
    res.json(await SessionService.joinSession(req.user!.id, req.body.joinCode));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const getSession = async (req: AuthedRequest, res: Response) => {
  try {
    const session = await SessionService.assertParticipantOrTeacher(String(req.params.id), req.user!.id);
    const participants = await SessionService.getParticipants(String(req.params.id));
    res.json({ session, participants });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const endSession = async (req: AuthedRequest, res: Response) => {
  try {
    res.json(await SessionService.endSession(String(req.params.id), req.user!.id));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const getReport = async (req: AuthedRequest, res: Response) => {
  try {
    await SessionService.assertParticipantOrTeacher(String(req.params.id), req.user!.id);
    res.json(await SessionService.getReport(String(req.params.id)));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
