"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Upload, 
  Download, 
  FileSpreadsheet,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
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

// CSV template for download
const CSV_TEMPLATE = `Name,Category,Supplier,Unit,Cost,Notes
"Example Material","Category Name","Supplier Name","Each","25.50","Optional notes"
"Another Material","Paint","Dulux","Litre","45.00","Premium grade"
"Third Item","Hardware","Bunnings","Box","12.99",""`;

export default function MaterialsLibraryClient() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // File upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<{ count: number; sample: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setSelectedIds(new Set()); // Clear selection when refreshing
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

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
      setSuccess("Material added successfully");
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
      setSuccess("Material updated successfully");
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

      setSuccess("Material archived successfully");
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

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === materials.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(materials.map(m => m.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    if (!confirm(`Archive ${count} selected material${count > 1 ? "s" : ""}? They will be hidden but can be restored.`)) {
      return;
    }

    try {
      const response = await fetch("/api/materials/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to archive materials");
      }

      const data = await response.json();
      setSuccess(`Archived ${data.archived} materials`);
      setSelectedIds(new Set());
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive materials");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Archive ALL ${materials.length} materials in your library? This action can be undone by contacting support.`)) {
      return;
    }
    
    // Double confirm for destructive action
    if (!confirm("Are you sure? This will archive your entire materials library.")) {
      return;
    }

    try {
      const response = await fetch("/api/materials/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to archive materials");
      }

      const data = await response.json();
      setSuccess(`Archived ${data.archived} materials`);
      setSelectedIds(new Set());
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive materials");
    }
  };

  // File upload handlers
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setError("");
      
      // Preview file
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split(/\r?\n/).filter(l => l.trim());
        const dataLines = lines.slice(1).filter(l => l.trim());
        setUploadPreview({
          count: dataLines.length,
          sample: dataLines.slice(0, 3),
        });
      };
      reader.readAsText(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!uploadFile) {
      setError("Please select a file");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch("/api/materials/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import materials");
      }

      setSuccess(`Successfully imported ${data.imported} materials`);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import materials");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "materials_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMaterials = () => {
    if (materials.length === 0) {
      setError("No materials to export");
      return;
    }

    const csvContent = [
      "Name,Category,Supplier,Unit,Cost,Notes",
      ...materials.map(m => {
        const escapeCsv = (val: string | null) => {
          if (!val) return "";
          if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        };
        return [
          escapeCsv(m.name),
          escapeCsv(m.category),
          escapeCsv(m.supplier),
          escapeCsv(m.unitLabel),
          m.unitCost?.toFixed(2) || "",
          escapeCsv(m.notes),
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `materials_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
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
            
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5" />
              Import CSV
            </button>
            
            <button
              onClick={exportMaterials}
              disabled={materials.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
            
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className={`inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors ${
                showBulkActions 
                  ? "bg-slate-700 text-white hover:bg-slate-600" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              Bulk Select
            </button>
          </div>
        </div>
        
        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {selectedIds.size} of {materials.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                {selectedIds.size === materials.length ? "Deselect All" : "Select All"}
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Archive Selected
                </button>
              )}
              {materials.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium ml-4"
                >
                  <Trash2 className="w-4 h-4" />
                  Archive All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Import Materials from CSV</h2>
                <button
                  onClick={closeUploadModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Instructions */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-2">CSV Format Requirements</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• First row must be headers</li>
                  <li>• Required columns: <span className="font-medium">Name, Unit</span></li>
                  <li>• Optional: Category, Supplier, Cost, Notes</li>
                  <li>• Maximum 500 items per upload</li>
                  <li>• Maximum file size: 5MB</li>
                </ul>
                <button
                  onClick={downloadTemplate}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download CSV Template
                </button>
              </div>
              
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select CSV File
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-500 file:text-slate-900 file:font-medium hover:file:bg-amber-400 file:cursor-pointer cursor-pointer"
                  />
                </div>
              </div>
              
              {/* Preview */}
              {uploadPreview && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-800">
                      {uploadPreview.count} materials found
                    </span>
                  </div>
                  {uploadPreview.sample.length > 0 && (
                    <div className="text-sm text-emerald-700">
                      <p className="font-medium mb-1">Preview:</p>
                      {uploadPreview.sample.map((line, i) => (
                        <p key={i} className="truncate text-xs font-mono">{line}</p>
                      ))}
                      {uploadPreview.count > 3 && (
                        <p className="text-xs mt-1">...and {uploadPreview.count - 3} more</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeUploadModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || isUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Import Materials
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
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
              : "Start building your materials library by adding materials individually or importing from a CSV file."}
          </p>
          {!searchQuery && (
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Material
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5" />
                Import from CSV
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {showBulkActions && (
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={toggleSelectAll}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {selectedIds.size === materials.length ? (
                          <CheckSquare className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                  )}
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
                  <tr key={material.id} className={`hover:bg-slate-50 ${selectedIds.has(material.id) ? "bg-amber-50" : ""}`}>
                    {showBulkActions && (
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleSelect(material.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {selectedIds.has(material.id) ? (
                            <CheckSquare className="w-5 h-5 text-amber-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    )}
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
          
          {/* Table Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
            {materials.length} material{materials.length !== 1 ? "s" : ""} in library
          </div>
        </div>
      )}
    </div>
  );
}
