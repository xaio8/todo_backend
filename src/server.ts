import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkConnection } from "./db/index.js";
import adminRoute from "./routes/admin.router.js";
import aiRouter from "./routes/openRouter.router.js";

dotenv.config();

const port = Number(process.env.PORT ?? 3000);
const api = process.env.API_URL ?? "";

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

// user route
app.use(api, router);

// ai route
app.use(`${api}/ai`, aiRouter);

// admin route
app.use(`${api}/admin`, adminRoute);

//global error handler
app.use(errorHandler);

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  await checkConnection();
});
