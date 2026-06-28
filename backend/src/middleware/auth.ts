import { Request, Response, NextFunction } from "express";
import { AuthService, Role, TokenPayload } from "../services/auth.service";

export interface AuthedRequest extends Request {
  user?: TokenPayload;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    req.user = AuthService.verify(token);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole =
  (role: Role) => (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: `Only a ${role.toLowerCase()} can do this` });
    }
    next();
  };
