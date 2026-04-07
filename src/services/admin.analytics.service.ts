import { db } from "../db/index.js";
import { todos } from "../db/schema.js";
import { sql } from "drizzle-orm";

export class AdminAnalyticsService {
  /**
   * GLOBAL YEARLY STATS: Monthly counts for the entire platform
   */
  static async getGlobalMonthlyStats(year: number) {
    const monthSql = sql`extract(month from ${todos.createdAt})`;
    const monthlyData = await db
      .select({
        month: sql<number>`extract(month from ${todos.createdAt})`,
        totalCreated: sql<number>`count(*)`,
        totalCompleted: sql<number>`count(*) filter (where ${todos.status} = ${"completed"})`,
      })
      .from(todos)
      .where(sql`extract(year from ${todos.createdAt}) = ${year}`)
      .groupBy(monthSql)
      .orderBy(monthSql);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // 2. Fill gaps so the frontend receives 12 data points
    return months.map((name, i) => {
      const monthNum = i + 1;
      const found = monthlyData.find((d) => Number(d.month) === monthNum);

      return {
        month: name,
        total: Number(found?.totalCreated || 0),
        completed: Number(found?.totalCompleted || 0),
        // Calculate the success rate for the entire platform that month
        successRate: found?.totalCreated
          ? (
              (Number(found.totalCompleted) / Number(found.totalCreated)) *
              100
            ).toFixed(1) + "%"
          : "0%",
      };
    });
  }

  /**
   * SYSTEM HEALTH: Key Performance Indicators (KPIs)
   */
  static async getSystemKPIs() {
    const now = new Date();

    const [result] = await db
      .select({
        totalTodos: sql<number>`count(*)`,
        avgCompletionRate: sql<number>`count(*) filter (where ${todos.status} = ${"completed"}) * 100.0 / count(*)`,
        onTimeRate: sql<number>`count(*) filter (where ${todos.status} = ${"completed"} and ${todos.updatedAt} <= ${todos.dueDate}) * 100.0 / count(*) filter (where ${todos.status} = ${"completed"})`,
        overdueRate: sql<number>`count(*) filter (where ${todos.status} <> ${"completed"} and ${todos.dueDate} < ${now}) * 100.0 / count(*)`,
      })
      .from(todos);

    return {
      totalSystemTodos: Number(result.totalTodos),
      globalCompletionRate: Number(result.avgCompletionRate).toFixed(1) + "%",
      globalOnTimeRate: Number(result.onTimeRate).toFixed(1) + "%",
      globalOverdueRate: Number(result.overdueRate).toFixed(1) + "%",
    };
  }
}
