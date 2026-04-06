import { count, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

export class UserService {

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
}
