import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkConnection } from "./db/index.js";
import adminRoute from "./routes/admin.router.js";
import aiRouter from "./routes/openRouter.router.js";
import { registerChatHandlers } from "./socket/chat.socket.js";

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
app.use(bodyParser.urlencoded({ extended: true }));
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
});
