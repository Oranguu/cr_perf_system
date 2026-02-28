import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import dimensionRoutes from "./routes/dimensions.js";
import scopeRoutes from "./routes/managerScopes.js";
import evaluationRoutes from "./routes/evaluations.js";
import reportRoutes from "./routes/reports.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/dimensions", dimensionRoutes);
app.use("/manager-scopes", scopeRoutes);
app.use("/evaluations", evaluationRoutes);
app.use("/reports", reportRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "接口不存在" });
});
