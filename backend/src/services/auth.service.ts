import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { JWT_SECRET, TOKEN_TTL } from "../config/env";

export type Role = "TEACHER" | "STUDENT";
export type PublicUser = { id: string; name: string; email: string; role: Role };
export type TokenPayload = { id: string; role: Role };

export class AuthService {
  static async register(data: { name?: string; email?: string; password?: string; role?: string }) {
    const name = (data.name ?? "").trim();
    const email = (data.email ?? "").trim().toLowerCase();
    const password = data.password ?? "";
    const role: Role = data.role === "TEACHER" ? "TEACHER" : "STUDENT";

    if (!name) throw new Error("Name is required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("That email is already registered");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, passwordHash, role } });
    return this.issue(user);
  }

  static async login(data: { email?: string; password?: string }) {
    const email = (data.email ?? "").trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid email or password");

    const ok = await bcrypt.compare(data.password ?? "", user.passwordHash);
    if (!ok) throw new Error("Invalid email or password");

    return this.issue(user);
  }

  static issue(user: { id: string; name: string; email: string; role: Role }) {
    const payload: TokenPayload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
    return { token, user: this.publicUser(user) };
  }

  static publicUser(user: { id: string; name: string; email: string; role: Role }): PublicUser {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  static verify(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  static async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.publicUser(user) : null;
  }
}
