import { Router, Request, Response } from "express";

const todoRoute = Router();

todoRoute.get("/", (req: Request, res: Response) => res.json({ todo: [] }));

export default todoRoute;
