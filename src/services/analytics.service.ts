import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { todos, users } from "../db/schema.js";

export class AnalyticsService {
  // raw db count to percentage strings
  private static calculateRate(part: number, total: number): string {
    return total > 0 ? ((part / total) * 100).toFixed(2) + "%" : "0%";
  }

  //  Detailed stats for a specific user
  static async getUserAnalysis(userId: string) {
    const now = new Date();

    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${todos.status}= ${"completed"})`,
        pending: sql<number>`count(*) filter (where ${todos.status} = ${"pending"})`,
        inProgress: sql<number>`count(*) filter (where ${todos.status} = ${"in_progress"})`,
        onTime: sql<number>`count(*) filter (where ${todos.status} = ${"completed"} and ${todos.updatedAt} <= ${todos.dueDate})`,
        overdue: sql<number>`count(*) filter (where ${todos.status} <> ${"completed"} and ${todos.dueDate} < ${now})`,
      })
      .from(todos)
      .where(eq(todos.userId, userId));

    const total = Number(stats.total);

    return {
      counts: {
        total,
        completed: Number(stats.completed),
        pending: Number(stats.pending),
        inProgress: Number(stats.inProgress),
        onTime: Number(stats.onTime),
        overdue: Number(stats.overdue),
      },
      rates: {
        completionRate: this.calculateRate(stats.completed, total),
        pendingRate: this.calculateRate(stats.pending, total),
        inProgressRate: this.calculateRate(stats.inProgress, total),
        onTimeRate: this.calculateRate(stats.onTime, total),
        overdueRate: this.calculateRate(stats.overdue, total),
      },
    };
  }

  //   Monthly counts for a specific user :YEARLY CHART
  static async getMonthlyStats(userId: string, year: number) {
    const monthSql = sql`extract(month from ${todos.createdAt})`;
    const monthlyData = await db
      .select({
        month: sql<number>`extract(month from ${todos.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(todos)
      .where(
        and(
          eq(todos.userId, userId),
          sql`extract(year from ${todos.createdAt})= ${year}`,
        ),
      )
      .groupBy(monthSql);
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

    return months.map((name, i) => ({
      month: name,
      count: Number(
        monthlyData.find((d) => Number(d.month) === i + 1)?.count || 0,
      ),
    }));
  }

  //   Global stats across all uses
  static async getGlobalAnalysis() {
    const [global] = await db
      .select({
        totalUsers: sql<number>`(select count(*) from ${users})`,
        totalTodos: sql<number>`count(*)`,
        avgTodosPerUser: sql<number>`count(*) * 1.0 / (select count(*) from ${users})`,
        globalCompletionRate: sql<number>`count(*) filter (where ${todos.status} = ${"completed"}) * 100.0 / count(*)`,
      })
      .from(todos);

    return {
      totalUsers: Number(global.totalUsers),
      totalTodos: Number(global.totalTodos),
      avgTodosPerUser: Number(global.avgTodosPerUser).toFixed(2),
      globalCompletionRate:
        Number(global.globalCompletionRate).toFixed(2) + "%",
    };
  }
}
