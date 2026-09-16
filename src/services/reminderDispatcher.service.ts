import { inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { todos } from "../db/schema.js";
import NotificationService from "./notification.service.js";

class ReminderDispatcherService {
  // claim due reminders atomically (is_sent flip) so restarts or multiple
  // instances can never double-send, then deliver as notifications
  static async tick(): Promise<void> {
    const claimed = await db.execute(sql`
      UPDATE reminders SET is_sent = true
      WHERE id IN (
        SELECT id FROM reminders
        WHERE remind_at <= now() AND is_sent = false
        ORDER BY remind_at ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, user_id, todo_id
    `);

    const rows = (claimed as unknown as { rows: ClaimedReminder[] }).rows;
    if (!rows || rows.length === 0) return;

    const todoIds = [...new Set(rows.map((row) => row.todo_id))];
    const todoRows = await db
      .select({ id: todos.id, title: todos.title })
      .from(todos)
      .where(inArray(todos.id, todoIds));
    const titles = new Map(todoRows.map((t) => [t.id, t.title]));

    await Promise.all(
      rows.map((row) =>
        NotificationService.create({
          userId: row.user_id,
          type: "todo_reminder",
          title: "Todo reminder",
          body: titles.get(row.todo_id) ?? "You have a scheduled todo",
          referenceId: row.todo_id,
        }).catch((error) => {
          console.error(
            `⚠️ Failed to deliver reminder ${row.id}:`,
            error instanceof Error ? error.message : error,
          );
        }),
      ),
    );

    console.log(`⏰ Dispatched ${rows.length} reminder(s)`);
  }

  static start(intervalMs = 20_000): void {
    setInterval(() => {
      this.tick().catch((error) =>
        console.error(
          "⚠️ Reminder dispatcher tick failed:",
          error instanceof Error ? error.message : error,
        ),
      );
    }, intervalMs);
  }
}

interface ClaimedReminder {
  id: string;
  user_id: string;
  todo_id: string;
}

export default ReminderDispatcherService;
