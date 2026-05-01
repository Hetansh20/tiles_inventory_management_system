import React, { useMemo } from "react";
import ActivityTimeline from "../components/ActivityTimeline";

export default function ActivityLogsPage({ transactions }) {
  const activities = useMemo(
    () =>
      [...(transactions || [])]
        .map(t => ({...t, date: t.createdAt || t.date || new Date().toISOString()}))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .map((item) => ({
          id: item.id,
          action: `${item.type} of ${item.quantity} units (Ref: ${item.referenceId || item.reason})`,
          performedBy: item.performedBy?.name || item.performedBy || "Unknown",
          date: item.date,
        })),
    [transactions]
  );

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Audit Trail Timeline</h2>
      <ActivityTimeline activities={activities} />
    </section>
  );
}
