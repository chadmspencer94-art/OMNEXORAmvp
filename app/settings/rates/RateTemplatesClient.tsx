"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, Star } from "lucide-react";
import Link from "next/link";

interface RateTemplate {
  id: string;
  name: string;
  tradeType: string | null;
  propertyType: string | null;
  hourlyRate: number | null;
  helperHourlyRate: number | null;
  dayRate: number | null;
  calloutFee: number | null;
  minCharge: number | null;
  ratePerM2Interior: number | null;
  ratePerM2Exterior: number | null;
  ratePerLmTrim: number | null;
  materialMarkupPercent: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const TRADE_TYPES = ["Painter", "Plasterer", "Carpenter", "Electrician", "Roofer", "Plumber", "Concreter", "HVAC", "Flooring", "Landscaper", "Tiler", "Other"];
const PROPERTY_TYPES = ["Residential", "Commercial", "Strata", "Other"];

export default function RateTemplatesClient() {
  const [templates, setTemplates] = useState<RateTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    tradeType: "",
    propertyType: "",
    hourlyRate: "",
    helperHourlyRate: "",
    dayRate: "",
    calloutFee: "",
    minCharge: "",
    ratePerM2Interior: "",
    ratePerM2Exterior: "",
    ratePerLmTrim: "",
    materialMarkupPercent: "",
    isDefault: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rate-templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    try {
      const response = await fetch("/api/rate-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          tradeType: formData.tradeType || null,
          propertyType: formData.propertyType || null,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          helperHourlyRate: formData.helperHourlyRate ? parseFloat(formData.helperHourlyRate) : null,
          dayRate: formData.dayRate ? parseFloat(formData.dayRate) : null,
          calloutFee: formData.calloutFee ? parseFloat(formData.calloutFee) : null,
          minCharge: formData.minCharge ? parseFloat(formData.minCharge) : null,
          ratePerM2Interior: formData.ratePerM2Interior ? parseFloat(formData.ratePerM2Interior) : null,
          ratePerM2Exterior: formData.ratePerM2Exterior ? parseFloat(formData.ratePerM2Exterior) : null,
          ratePerLmTrim: formData.ratePerLmTrim ? parseFloat(formData.ratePerLmTrim) : null,
          materialMarkupPercent: formData.materialMarkupPercent ? parseFloat(formData.materialMarkupPercent) : null,
          isDefault: formData.isDefault,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create template");
      }

      resetForm();
      setShowAddForm(false);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    }
  };

  const handleEdit = (template: RateTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      tradeType: template.tradeType || "",
      propertyType: template.propertyType || "",
      hourlyRate: template.hourlyRate?.toString() || "",
      helperHourlyRate: template.helperHourlyRate?.toString() || "",
      dayRate: template.dayRate?.toString() || "",
      calloutFee: template.calloutFee?.toString() || "",
      minCharge: template.minCharge?.toString() || "",
      ratePerM2Interior: template.ratePerM2Interior?.toString() || "",
      ratePerM2Exterior: template.ratePerM2Exterior?.toString() || "",
      ratePerLmTrim: template.ratePerLmTrim?.toString() || "",
      materialMarkupPercent: template.materialMarkupPercent?.toString() || "",
      isDefault: template.isDefault,
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    try {
      const response = await fetch(`/api/rate-templates/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          tradeType: formData.tradeType || null,
          propertyType: formData.propertyType || null,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          helperHourlyRate: formData.helperHourlyRate ? parseFloat(formData.helperHourlyRate) : null,
          dayRate: formData.dayRate ? parseFloat(formData.dayRate) : null,
          calloutFee: formData.calloutFee ? parseFloat(formData.calloutFee) : null,
          minCharge: formData.minCharge ? parseFloat(formData.minCharge) : null,
          ratePerM2Interior: formData.ratePerM2Interior ? parseFloat(formData.ratePerM2Interior) : null,
          ratePerM2Exterior: formData.ratePerM2Exterior ? parseFloat(formData.ratePerM2Exterior) : null,
          ratePerLmTrim: formData.ratePerLmTrim ? parseFloat(formData.ratePerLmTrim) : null,
          materialMarkupPercent: formData.materialMarkupPercent ? parseFloat(formData.materialMarkupPercent) : null,
          isDefault: formData.isDefault,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update template");
      }

      resetForm();
      setEditingId(null);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update template");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rate template? Jobs using this template will keep their own rate copies.")) {
      return;
    }

    try {
      const response = await fetch(`/api/rate-templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      tradeType: "",
      propertyType: "",
      hourlyRate: "",
      helperHourlyRate: "",
      dayRate: "",
      calloutFee: "",
      minCharge: "",
      ratePerM2Interior: "",
      ratePerM2Exterior: "",
      ratePerLmTrim: "",
      materialMarkupPercent: "",
      isDefault: false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    resetForm();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Rate Templates</h1>
            <p className="mt-2 text-slate-600">
              Save common rate setups so you can apply them to new jobs quickly and keep your quotes consistent.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Apply these templates when creating new jobs to keep rates consistent.
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

      {/* Add Template Button */}
      {!showAddForm && !editingId && (
        <div className="mb-6">
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Template
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="mb-6 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Edit Rate Template" : "Add New Rate Template"}
            </h2>
            <button
              onClick={cancelEdit}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Standard interior repaint"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Trade Type
              </label>
              <select
                value={formData.tradeType}
                onChange={(e) => setFormData({ ...formData, tradeType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              >
                <option value="">Any</option>
                {TRADE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Property Type
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              >
                <option value="">Any</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Helper Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.helperHourlyRate}
                onChange={(e) => setFormData({ ...formData, helperHourlyRate: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Day Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.dayRate}
                onChange={(e) => setFormData({ ...formData, dayRate: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Callout Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.calloutFee}
                onChange={(e) => setFormData({ ...formData, calloutFee: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Minimum Charge ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.minCharge}
                onChange={(e) => setFormData({ ...formData, minCharge: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rate per m² Interior ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.ratePerM2Interior}
                onChange={(e) => setFormData({ ...formData, ratePerM2Interior: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rate per m² Exterior ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.ratePerM2Exterior}
                onChange={(e) => setFormData({ ...formData, ratePerM2Exterior: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rate per Linear Metre ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.ratePerLmTrim}
                onChange={(e) => setFormData({ ...formData, ratePerLmTrim: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Material Markup (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.materialMarkupPercent}
                onChange={(e) => setFormData({ ...formData, materialMarkupPercent: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Set as my default template
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
              {editingId ? "Update" : "Create"} Template
            </button>
          </div>
        </div>
      )}

      {/* Templates Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-slate-500">Loading templates...</div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No rate templates yet</h2>
          <p className="text-slate-600 mb-6">
            Create your first rate template to quickly apply consistent rates to new jobs.
          </p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Template
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
                    Template Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Trade Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Property Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Hourly Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Material Markup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Default
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{template.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {template.tradeType || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {template.propertyType || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {template.hourlyRate != null ? `$${template.hourlyRate}/hr` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {template.materialMarkupPercent != null ? `${template.materialMarkupPercent}%` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {template.isDefault ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                          <Star className="w-3 h-3 fill-amber-600" />
                          Default
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(template)}
                          className="text-amber-600 hover:text-amber-700"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
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
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

