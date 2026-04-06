import { userRoleEnum } from "../db/schema.ts";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "user" | "admin";
      };
    }
  }
}
