import { Router, Request, Response } from "express";

const authRoute = Router();
authRoute.get("/", (req: Request, res: Response) => res.json({ users: [] }));

export default authRoute;
