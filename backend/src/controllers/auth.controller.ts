import { Response } from "express";
import { AuthService } from "../services/auth.service";
import { AuthedRequest } from "../middleware/auth";

export const register = async (req: AuthedRequest, res: Response) => {
  try {
    res.json(await AuthService.register(req.body));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const login = async (req: AuthedRequest, res: Response) => {
  try {
    res.json(await AuthService.login(req.body));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const me = async (req: AuthedRequest, res: Response) => {
  const user = await AuthService.getById(req.user!.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
};
