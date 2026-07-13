import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";

import { env } from "./src/config/env.js";
import authRoutes from "./src/routes/auth.routes.js";
import { errorHandler } from "./src/middlewares/error.middleware.js";

const app = express();

// Security & Utility Middlewares
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(compression());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

// Health Check
app.get("/", (req, res) => {
    res.json({ success: true, message: "FlowForge Backend Running 🚀" });
});

// Routes
app.use("/api/auth", authRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;