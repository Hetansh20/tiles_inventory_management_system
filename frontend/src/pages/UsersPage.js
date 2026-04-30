import React, { useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";
import FormModal from "../components/FormModal";
import PermissionBanner from "../components/PermissionBanner";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import useDebounce from "../hooks/useDebounce";

const defaultForm = { name: "", email: "", role: "staff", isActive: true, permissions: [] };

const availableModules = [
  { id: "inventory", label: "Record Stock Movements" },
  { id: "products", label: "Manage Products" },
  { id: "categories", label: "Manage Categories" },
  { id: "suppliers", label: "Manage Suppliers" },
  { id: "orders", label: "Manage Purchase Orders" },
  { id: "warehouses", label: "Manage Warehouses" },
  { id: "transfers", label: "Manage Transfers" }
];

export default function UsersPage({ users, saveUser, toggleUserStatus, canEdit }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [pendingToggleUser, setPendingToggleUser] = useState(null);
  const debouncedQuery = useDebounce(query, 250);

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        const matchesQuery = `${user.name} ${user.email}`.toLowerCase().includes(debouncedQuery.toLowerCase());
        const matchesRole = role === "all" || user.role === role;
        return matchesQuery && matchesRole;
      }),
    [users, debouncedQuery, role]
  );

  const columns = [
    { key: "name", header: "Name", render: (row) => <p className="font-semibold">{row.name}</p> },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row) => <StatusBadge label={row.role} tone={row.role === "admin" ? "info" : "neutral"} />,
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => <StatusBadge label={row.isActive ? "Active" : "Inactive"} tone={row.isActive ? "success" : "danger"} />,
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (row) => {
        if (row.role === "admin") return <span className="text-slate-400 italic">All Access</span>;
        if (!row.permissions || row.permissions.length === 0) return <span className="text-slate-400 italic">None</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {row.permissions.map(pId => {
              const label = availableModules.find(m => m.id === pId)?.label || pId;
              return <span key={pId} className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 border border-slate-200">{label}</span>;
            })}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canEdit}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
            onClick={() => openEditModal(row)}
          >
            Edit
          </button>
          <button
            type="button"
            disabled={!canEdit}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
            onClick={() => setPendingToggleUser(row)}
          >
            {row.isActive ? "Disable" : "Enable"}
          </button>
        </div>
      ),
    },
  ];

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({ ...user, permissions: user.permissions || [] });
    setModalOpen(true);
  };

  const submit = (event) => {
    event.preventDefault();
    saveUser({ ...form, id: editingUser?.id });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {!canEdit ? <PermissionBanner message="Staff role: users management is restricted." /> : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <SearchBar value={query} onChange={setQuery} placeholder="Search users by name or email" />
          <FilterDropdown
            label="Role"
            value={role}
            onChange={setRole}
            options={[
              { label: "All", value: "all" },
              { label: "Admin", value: "admin" },
              { label: "Staff", value: "staff" },
            ]}
          />
        </div>
        <button
          type="button"
          disabled={!canEdit}
          onClick={openCreateModal}
          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-40"
        >
          Add User
        </button>
      </div>

      <DataTable columns={columns} data={filtered} emptyTitle="No users found" emptyDescription="Try changing your search or filter." />

      <ConfirmDialog
        isOpen={Boolean(pendingToggleUser)}
        title="Confirm User Status Update"
        message={
          pendingToggleUser
            ? `Are you sure you want to ${pendingToggleUser.isActive ? "disable" : "enable"} ${pendingToggleUser.name}?`
            : ""
        }
        confirmLabel="Yes, update"
        onCancel={() => setPendingToggleUser(null)}
        onConfirm={() => {
          if (pendingToggleUser) {
            toggleUserStatus(pendingToggleUser.id);
          }
          setPendingToggleUser(null);
        }}
      />

      <FormModal isOpen={isModalOpen} title={editingUser ? "Edit User" : "Add User"} onClose={() => setModalOpen(false)}>
        <form className="grid gap-4" onSubmit={submit}>
          <Input label="Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <Input label="Email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Role
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </label>
          <div className="flex gap-4 border-t border-slate-100 pt-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 w-full">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              Active User (Can log in)
            </label>
          </div>

          {form.role === "staff" && (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <span className="text-sm font-bold text-slate-700">Module Permissions</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableModules.map((mod) => (
                  <label key={mod.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.permissions?.includes(mod.id)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setForm((prev) => {
                          const newPerms = checked
                            ? [...(prev.permissions || []), mod.id]
                            : (prev.permissions || []).filter((p) => p !== mod.id);
                          return { ...prev, permissions: newPerms };
                        });
                      }}
                    />
                    {mod.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white">
              Save
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      />
    </label>
  );
}
