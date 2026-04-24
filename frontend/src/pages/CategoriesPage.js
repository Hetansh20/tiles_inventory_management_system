import React, { useState } from "react";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import PermissionBanner from "../components/PermissionBanner";
import Button from "../components/Button";

const defaultForm = { name: "", description: "" };

export default function CategoriesPage({ categories, saveCategory, deleteCategory, canEdit }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  const columns = [
    { key: "name", header: "Name", render: (row) => <p className="font-semibold">{row.name}</p> },
    { key: "description", header: "Description" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canEdit}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 transition dark:border-slate-600 dark:hover:bg-slate-700 disabled:opacity-40"
            onClick={() => openEditModal(row)}
          >
            Edit
          </button>
          <button
            type="button"
            disabled={!canEdit}
            className="rounded-lg bg-black dark:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-black transition disabled:opacity-40"
            onClick={() => {
              if (window.confirm("Delete this category?")) {
                deleteCategory(row._id || row.id);
              }
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(defaultForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({ name: category.name, description: category.description || "" });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    const duplicate = categories.some(
      (c) => c.name.toLowerCase() === form.name.trim().toLowerCase() && c._id !== editingCategory?._id
    );
    if (duplicate) nextErrors.name = "Category name must be unique";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    saveCategory({ ...form, id: editingCategory?._id || editingCategory?.id });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {!canEdit ? <PermissionBanner message="Staff role: view-only category access." /> : null}

      <div className="flex justify-end gap-2">
        <Button variant="primary" disabled={!canEdit} onClick={openCreateModal}>
          Add Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        emptyTitle="No categories found"
      />

      <FormModal isOpen={isModalOpen} title={editingCategory ? "Edit Category" : "Add Category"} onClose={() => setModalOpen(false)}>
        <form className="grid grid-cols-1 gap-4" onSubmit={submit}>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Name
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            {errors.name ? <span className="text-xs text-rose-600">{errors.name}</span> : null}
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              rows={3}
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
