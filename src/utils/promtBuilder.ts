import { AdminAnalytics } from "../types/index.js";

export const buildAnalyticsPrompt = (year: number, analytics: AdminAnalytics) => {
  return `
You are an analytics assistant for a todo management platform.

Please respond in a clear and concise manner, providing insights based on the provided statistics.
And using burmese language for your response.

Analyze the following platform-wide todo statistics for ${year}.

DATA:

System KPIs:
- Total todos: ${analytics.kpis.totalSystemTodos}
- Completion rate: ${analytics.kpis.globalCompletionRate}
- On-time completion rate: ${analytics.kpis.globalOnTimeRate}
- Overdue rate: ${analytics.kpis.globalOverdueRate}

Monthly statistics:
${JSON.stringify(analytics.monthlyStats, null, 2)}

Provide a concise but useful management analysis.

Your analysis should include:

1. Overall performance
2. Monthly trends
3. Best-performing month
4. Worst-performing month
5. Completion performance
6. On-time performance
7. Overdue concerns
8. Important patterns or anomalies
9. Three actionable recommendations

Do not invent data that is not present.
Base your conclusions only on the provided statistics.
`;
};
