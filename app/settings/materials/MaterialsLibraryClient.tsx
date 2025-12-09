"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, X, Save } from "lucide-react";
import Link from "next/link";

interface MaterialItem {
  id: string;
  name: string;
  category: string | null;
  supplier: string | null;
  unitLabel: string;
  unitCost: number | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MaterialsLibraryClient() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    supplier: "",
    unitLabel: "",
    unitCost: "",
    notes: "",
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      params.set("includeArchived", "false");

      const response = await fetch(`/api/materials?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch materials");
      }

      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load materials");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!showAddForm && !editingId) {
        fetchMaterials();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleAdd = async () => {
    if (!formData.name || !formData.unitLabel) {
      setError("Name and unit label are required");
      return;
    }

    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category || null,
          supplier: formData.supplier || null,
          unitLabel: formData.unitLabel,
          unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create material");
      }

      setFormData({
        name: "",
        category: "",
        supplier: "",
        unitLabel: "",
        unitCost: "",
        notes: "",
      });
      setShowAddForm(false);
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create material");
    }
  };

  const handleEdit = (material: MaterialItem) => {
    setEditingId(material.id);
    setFormData({
      name: material.name,
      category: material.category || "",
      supplier: material.supplier || "",
      unitLabel: material.unitLabel,
      unitCost: material.unitCost?.toString() || "",
      notes: material.notes || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name || !formData.unitLabel) {
      setError("Name and unit label are required");
      return;
    }

    try {
      const response = await fetch(`/api/materials/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category || null,
          supplier: formData.supplier || null,
          unitLabel: formData.unitLabel,
          unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update material");
      }

      setEditingId(null);
      setFormData({
        name: "",
        category: "",
        supplier: "",
        unitLabel: "",
        unitCost: "",
        notes: "",
      });
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update material");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this material? It will be hidden but can be restored.")) {
      return;
    }

    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to archive material");
      }

      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive material");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      name: "",
      category: "",
      supplier: "",
      unitLabel: "",
      unitCost: "",
      notes: "",
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Materials Library</h1>
            <p className="mt-2 text-slate-600">
              Manage your materials library for quick access when creating job quotes.
            </p>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            ← Back to Settings
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search and Add */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Material
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="mb-6 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Edit Material" : "Add New Material"}
            </h2>
            <button
              onClick={cancelEdit}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dulux Wash & Wear Low Sheen White"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Paint, Primer, Filler"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g. Paint Place, Bunnings"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.unitLabel}
                onChange={(e) => setFormData({ ...formData, unitLabel: e.target.value })}
                placeholder="e.g. Litre, 4L can, Each"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes (finish, base, etc.)"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {editingId ? "Update" : "Add"} Material
            </button>
          </div>
        </div>
      )}

      {/* Materials Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-slate-500">Loading materials...</div>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No materials yet</h2>
          <p className="text-slate-600 mb-6">
            {searchQuery
              ? "No materials match your search. Try different keywords."
              : "Start building your materials library by adding your first material."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Material
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {materials.map((material) => (
                  <tr key={material.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{material.name}</div>
                      {material.notes && (
                        <div className="text-xs text-slate-500 mt-1">{material.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {material.category || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {material.supplier || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {material.unitLabel}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {material.unitCost != null ? `$${material.unitCost.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-6 py-4">
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
                          title="Archive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

