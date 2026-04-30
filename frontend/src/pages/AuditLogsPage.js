import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";
import StatusBadge from "../components/StatusBadge";
import FormModal from "../components/FormModal";
import { apiCall } from "../utils/api";
import { exportToCsv } from "../utils/exportUtils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [moduleFilter, setModuleFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // View Details Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (moduleFilter !== "all") params.append("module", moduleFilter);
      if (userFilter !== "all") params.append("user", userFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiCall(`/audit-logs?${params.toString()}`);
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, userFilter, startDate, endDate]);

  const uniqueUsers = useMemo(() => {
    const usersMap = new Map();
    logs.forEach(log => {
      if (log.user) usersMap.set(log.user._id, log.user.name);
    });
    return Array.from(usersMap.entries()).map(([value, label]) => ({ label, value }));
  }, [logs]);

  const columns = [
    { key: "timestamp", header: "Timestamp", render: (row) => new Date(row.createdAt).toLocaleString() },
    { key: "user", header: "User", render: (row) => <span className="font-semibold">{row.user?.name || "Unknown"}</span> },
    { key: "module", header: "Module", render: (row) => <span className="uppercase text-xs font-bold tracking-wider text-slate-500">{row.module}</span> },
    { key: "action", header: "Action", render: (row) => <StatusBadge label={row.action} tone={row.action === "DELETE" ? "danger" : row.action === "CREATE" ? "success" : "info"} /> },
    { key: "targetId", header: "Record ID", render: (row) => <span className="font-mono text-xs text-slate-400">{row.targetId}</span> },
    {
      key: "details",
      header: "Details",
      render: (row) => (
        <button 
          onClick={() => setSelectedLog(row)}
          className="text-xs font-bold text-sky-600 hover:underline"
        >
          View Diff
        </button>
      )
    }
  ];

  const exportData = logs.map(log => ({
    Timestamp: new Date(log.createdAt).toLocaleString(),
    User: log.user?.name || "Unknown",
    Module: log.module,
    Action: log.action,
    RecordID: log.targetId
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <FilterDropdown 
          label="Module" 
          value={moduleFilter} 
          onChange={setModuleFilter} 
          options={[
            {label: "All Modules", value: "all"},
            {label: "Users", value: "users"},
            {label: "Products", value: "products"},
            {label: "Categories", value: "categories"},
            {label: "Suppliers", value: "suppliers"},
            {label: "Orders", value: "orders"}
          ]} 
        />
        
        {/* We derive users from logs for simplicity, or we could fetch all users. */}
        <FilterDropdown 
          label="User" 
          value={userFilter} 
          onChange={setUserFilter} 
          options={[{label: "All Users", value: "all"}, ...uniqueUsers]} 
        />
        
        <label className="flex min-w-[150px] flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          From
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
        </label>
        <label className="flex min-w-[150px] flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          To
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
        </label>
        
        <div className="ml-auto">
          <button type="button" onClick={() => exportToCsv("audit-logs", exportData)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm">Export CSV</button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-slate-500 py-10">Loading audit trail...</p>
      ) : (
        <DataTable columns={columns} data={logs} emptyTitle="No logs found" emptyDescription="Try adjusting your filters." />
      )}

      {selectedLog && (
        <FormModal isOpen={!!selectedLog} title={`Audit Details: ${selectedLog.action} on ${selectedLog.module}`} onClose={() => setSelectedLog(null)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto">
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Before State</p>
              <pre className="text-[10px] text-slate-700 font-mono">
                {selectedLog.beforeState ? JSON.stringify(selectedLog.beforeState, null, 2) : "Null (Creation Event)"}
              </pre>
            </div>
            <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 overflow-x-auto">
              <p className="text-xs font-bold text-sky-700 mb-2 uppercase tracking-wider">After State</p>
              <pre className="text-[10px] text-sky-900 font-mono">
                {selectedLog.afterState ? JSON.stringify(selectedLog.afterState, null, 2) : "Null (Deletion Event)"}
              </pre>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button type="button" onClick={() => setSelectedLog(null)} className="rounded-lg border border-slate-200 px-4 py-2">Close</button>
          </div>
        </FormModal>
      )}
    </div>
  );
}
