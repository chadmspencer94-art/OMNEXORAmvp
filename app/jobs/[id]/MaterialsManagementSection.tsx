"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, Loader2 } from "lucide-react";

interface MaterialItem {
  id: string;
  name: string;
  category: string | null;
  supplier: string | null;
  unitLabel: string;
  unitCost: number | null;
  notes: string | null;
}

interface JobMaterial {
  id: string;
  materialItemId: string | null;
  name: string;
  unitLabel: string;
  unitCost: number | null;
  quantity: number;
  markupPercent: number | null;
  notes: string | null;
  lineTotal: number | null;
  createdAt: string;
  updatedAt: string;
}

interface MaterialsManagementSectionProps {
  jobId: string;
  materialsTotal?: number | null;
}

export default function MaterialsManagementSection({
  jobId,
  materialsTotal,
}: MaterialsManagementSectionProps) {
  const [jobMaterials, setJobMaterials] = useState<JobMaterial[]>([]);
  const [libraryMaterials, setLibraryMaterials] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    materialItemId: "",
    name: "",
    unitLabel: "",
    unitCost: "",
    quantity: "",
    markupPercent: "",
    notes: "",
  });
  const [librarySearch, setLibrarySearch] = useState("");

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [materialsRes, libraryRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}/materials`),
        fetch("/api/materials?includeArchived=false"),
      ]);

      if (!materialsRes.ok || !libraryRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const materialsData = await materialsRes.json();
      const libraryData = await libraryRes.json();

      setJobMaterials(materialsData.materials || []);
      setLibraryMaterials(libraryData.materials || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load materials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFromLibrary = (material: MaterialItem) => {
    setFormData({
      materialItemId: material.id,
      name: material.name,
      unitLabel: material.unitLabel,
      unitCost: material.unitCost?.toString() || "",
      quantity: "",
      markupPercent: "",
      notes: material.notes || "",
    });
    setLibrarySearch("");
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.unitLabel || !formData.quantity) {
      setError("Name, unit label, and quantity are required");
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialItemId: formData.materialItemId || null,
          name: formData.name,
          unitLabel: formData.unitLabel,
          unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
          quantity: parseFloat(formData.quantity),
          markupPercent: formData.markupPercent ? parseFloat(formData.markupPercent) : null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add material");
      }

      const data = await response.json();
      setFormData({
        materialItemId: "",
        name: "",
        unitLabel: "",
        unitCost: "",
        quantity: "",
        markupPercent: "",
        notes: "",
      });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add material");
    }
  };

  const handleEdit = (material: JobMaterial) => {
    setEditingId(material.id);
    setFormData({
      materialItemId: material.materialItemId || "",
      name: material.name,
      unitLabel: material.unitLabel,
      unitCost: material.unitCost?.toString() || "",
      quantity: material.quantity.toString(),
      markupPercent: material.markupPercent?.toString() || "",
      notes: material.notes || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name || !formData.unitLabel || !formData.quantity) {
      setError("Name, unit label, and quantity are required");
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/materials/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          unitLabel: formData.unitLabel,
          unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
          quantity: parseFloat(formData.quantity),
          markupPercent: formData.markupPercent ? parseFloat(formData.markupPercent) : null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update material");
      }

      setEditingId(null);
      setFormData({
        materialItemId: "",
        name: "",
        unitLabel: "",
        unitCost: "",
        quantity: "",
        markupPercent: "",
        notes: "",
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update material");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this material from the job?")) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/materials/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove material");
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove material");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      materialItemId: "",
      name: "",
      unitLabel: "",
      unitCost: "",
      quantity: "",
      markupPercent: "",
      notes: "",
    });
  };

  const filteredLibrary = libraryMaterials.filter((m) =>
    m.name.toLowerCase().includes(librarySearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <Loader2 className="w-6 h-6 text-amber-600 animate-spin mx-auto mb-2" />
        <p className="text-slate-600">Loading materials...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Materials</h2>
            <p className="text-xs text-slate-500 mt-1">
              Manage materials line items for this job
            </p>
          </div>
          {!showAddForm && !editingId && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingId(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Material
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Materials Total Summary */}
        {materialsTotal != null && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-900">Materials Total:</span>
              <span className="text-lg font-bold text-amber-900">
                ${materialsTotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              This total is included in the job quote
            </p>
          </div>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingId ? "Edit Material Line Item" : "Add Material Line Item"}
              </h3>
              <button
                onClick={cancelEdit}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Library Selection */}
            {!editingId && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Select from Library (optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search materials library..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                  {librarySearch && filteredLibrary.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredLibrary.map((material) => (
                        <button
                          key={material.id}
                          onClick={() => handleSelectFromLibrary(material)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        >
                          <div className="font-medium text-slate-900">{material.name}</div>
                          <div className="text-xs text-slate-500">
                            {material.unitLabel}
                            {material.unitCost != null && ` • $${material.unitCost.toFixed(2)}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Material Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dulux Wash & Wear 10L"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.unitLabel}
                  onChange={(e) => setFormData({ ...formData, unitLabel: e.target.value })}
                  placeholder="e.g. Litre, Each, Box"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Markup (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.markupPercent}
                  onChange={(e) => setFormData({ ...formData, markupPercent: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Job-specific notes (optional)"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                {editingId ? "Update" : "Add"} Line Item
              </button>
            </div>
          </div>
        )}

        {/* Materials Table */}
        {jobMaterials.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No materials added yet. Click &quot;Add Material&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Markup %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Line Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {jobMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">{material.name}</div>
                      {material.notes && (
                        <div className="text-xs text-slate-500 mt-0.5">{material.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{material.unitLabel}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-right">
                      {material.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-right">
                      {material.unitCost != null ? `$${material.unitCost.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-right">
                      {material.markupPercent != null ? `${material.markupPercent}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">
                      {material.lineTotal != null ? `$${material.lineTotal.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="text-amber-600 hover:text-amber-700"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {jobMaterials.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">
                      {materialsTotal != null ? `$${materialsTotal.toFixed(2)}` : "—"}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

