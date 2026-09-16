import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkConnection, pool } from "./db/index.js";
import { checkRedisConnection, redis } from "./config/redis.js";
import adminRoute from "./routes/admin.router.js";
import aiRouter from "./routes/openRouter.router.js";
import { registerChatHandlers } from "./socket/chat.socket.js";
import ReminderDispatcherService from "./services/reminderDispatcher.service.js";

dotenv.config();

const port = Number(process.env.PORT ?? 3000);
const api = process.env.API_URL ?? "";
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  transports: ["websocket", "polling"],
});

registerChatHandlers(io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(cookieParser());

// user route
app.use(api, router);

// ai route
app.use(`${api}/ai`, aiRouter);

// admin route
app.use(`${api}/admin`, adminRoute);

//global error handler
app.use(errorHandler);

httpServer.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  await checkConnection();
  await checkRedisConnection();
  ReminderDispatcherService.start();
});

// graceful shutdown - docker stop / ctrl+c closes connections cleanly
const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);
  io.disconnectSockets(true);
  httpServer.close();
  await Promise.allSettled([redis.quit(), pool.end()]);
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
