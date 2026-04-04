import React, { useEffect, useMemo, useState } from "react";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns,
  data,
  rowKey = "id",
  pageSize = 8,
  loading = false,
  emptyTitle,
  emptyDescription,
  selectable = false,
  selectedRows,
  onSelectedRowsChange,
  bulkActions,
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [data.length]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const selectedIds = selectedRows || [];
  const pageIds = paginatedData.map((row) => row[rowKey]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleRow = (id) => {
    if (!onSelectedRowsChange) return;
    if (selectedIds.includes(id)) {
      onSelectedRowsChange(selectedIds.filter((entry) => entry !== id));
      return;
    }
    onSelectedRowsChange([...selectedIds, id]);
  };

  const togglePageSelection = () => {
    if (!onSelectedRowsChange) return;
    if (allPageSelected) {
      onSelectedRowsChange(selectedIds.filter((id) => !pageIds.includes(id)));
      return;
    }
    onSelectedRowsChange([...new Set([...selectedIds, ...pageIds])]);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        Loading records...
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 shadow-lg backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/50">
      {selectable && bulkActions?.length && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 dark:border-slate-700 dark:bg-sky-950/40 dark:text-sky-200">
          <span>{selectedIds.length} selected</span>
          <div className="flex gap-2">
            {bulkActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => action.onClick(selectedIds)}
                className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold dark:border-sky-800 dark:bg-slate-900"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="overflow-x-auto max-h-[600px]">
        <table className="min-w-full divide-y divide-slate-200/60 dark:divide-slate-700/60">
          <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md dark:bg-slate-800/95 shadow-sm">
            <tr>
              {selectable ? (
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allPageSelected} onChange={togglePageSelection} />
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
            {paginatedData.map((row) => (
              <tr key={row[rowKey]} className="group transition-all duration-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]">
                {selectable ? (
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row[rowKey])}
                      onChange={() => toggleRow(row[rowKey])}
                    />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={`${row[rowKey]}-${column.key}`} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200/50 bg-slate-50/50 px-4 py-3 text-xs text-slate-500 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-300">
        <span>
          Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, data.length)} of {data.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Prev
          </button>
          <span className="font-semibold text-slate-600 dark:text-slate-200">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
