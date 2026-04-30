import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import PermissionBanner from "../components/PermissionBanner";
import SearchBar from "../components/SearchBar";
import useDebounce from "../hooks/useDebounce";

const defaultForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
};

export default function SuppliersPage({ suppliers, saveSupplier, canEdit }) {
  const [query, setQuery] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const debouncedQuery = useDebounce(query, 250);

  const filtered = useMemo(
    () =>
      suppliers.filter((supplier) => {
        const text = `${supplier.name} ${supplier.contactPerson} ${supplier.email}`.toLowerCase();
        return text.includes(debouncedQuery.toLowerCase());
      }),
    [suppliers, debouncedQuery]
  );

  const columns = [
    { key: "name", header: "Supplier", render: (row) => <p className="font-semibold">{row.name}</p> },
    { key: "contactPerson", header: "Contact Person" },
    { key: "phone", header: "Contact Number" },
    { key: "email", header: "Email" },
    {
      key: "address",
      header: "Address",
      render: (row) => <span className="line-clamp-1 max-w-[280px]">{row.address}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <button
          type="button"
          disabled={!canEdit}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
          onClick={() => openEditModal(row)}
        >
          Edit
        </button>
      ),
    },
  ];

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setForm({ ...supplier });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingSupplier(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const submit = (event) => {
    event.preventDefault();
    saveSupplier({ ...form, id: editingSupplier?.id });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {!canEdit ? <PermissionBanner message="Staff role: suppliers are view-only." /> : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <SearchBar value={query} onChange={setQuery} placeholder="Search suppliers by name/contact" />
        <button
          type="button"
          disabled={!canEdit}
          onClick={openCreateModal}
          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-40"
        >
          Add Supplier
        </button>
      </div>

      <DataTable columns={columns} data={filtered} emptyTitle="No suppliers found" emptyDescription="Add your first supplier to begin ordering." />

      <FormModal isOpen={isModalOpen} title={editingSupplier ? "Edit Supplier" : "Add Supplier"} onClose={() => setModalOpen(false)}>
        <form className="grid gap-4" onSubmit={submit}>
          <Field label="Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} required />
          <Field
            label="Contact Person"
            value={form.contactPerson}
            onChange={(value) => setForm((prev) => ({ ...prev, contactPerson: value }))}
            required
          />
          <Field
            label="Contact Number"
            value={form.phone}
            onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
            required
          />
          <Field label="Email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} type="email" required />
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Address
            <textarea
              required
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              className="min-h-[90px] rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
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

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      />
    </label>
  );
}
