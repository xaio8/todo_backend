import { count, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { userRoleEnum, users } from "../db/schema.js";
import { string } from "zod";
import { SafeUser } from "../types/index.js";

export class UserService {
  //! FOR ADMIN
  // get all users
  static async getAllUsers(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [data, totalCounts] = await Promise.all([
      db
        .select()
        .from(users)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt)),
      db.select({ value: count() }).from(users),
    ]);

    const totalUsers = totalCounts[0].value;
    const totalPages = Math.ceil(totalUsers / limit);
    return {
      users: data,
      meta: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }

  // update user role by admin
  static async updateUserRole(
    id: string,
    role: (typeof userRoleEnum.enumValues)[number],
  ): Promise<SafeUser> {
    if (!userRoleEnum.enumValues.includes(role)) {
      throw new Error("Invalid role");
    }
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error("User not found");
    }
    const { password: _, refreshToken: __, ...safeUser } = updatedUser;
    return safeUser;
  }

  //! USER AND ADMIN
  // get user by id
  static async getUserById(id: string): Promise<SafeUser> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) {
      throw new Error("User not found");
    }
    const { password: _, refreshToken: __, ...safeUser } = user;
    return safeUser;
  }

  //! USER
  //update user info
  static async updateUserById(
    id: string,
    data: { name?: string; email?: string },
  ): Promise<SafeUser> {

    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

      if(!updatedUser){
        throw new Error("User not found")
      }

    const { password: _, refreshToken: __, ...safeUser } = updatedUser;
    return safeUser;
  }
}
