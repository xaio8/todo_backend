import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

export class AuthService {
  static async findUserByRefreshToken(refreshToken: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.refreshToken, refreshToken));
    return user;
  }

  static async updateUserRefreshToken(userId: string, refreshToken: string) {
    return await db
      .update(users)
      .set({ refreshToken: refreshToken })
      .where(eq(users.id, userId));
  }
}
