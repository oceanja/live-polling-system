import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import sessionRoutes from "./routes/session.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
