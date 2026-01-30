import express from "express";
import cors from "cors";
import pollRoutes from "./routes/poll.routes";
import studentRoutes from "./routes/student";
import answerRoutes from "./routes/answer";




const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/polls", pollRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/answer", answerRoutes);



app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
