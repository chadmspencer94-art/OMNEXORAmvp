"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addPriceListItem,
  updatePriceListItem,
  deletePriceListItem,
  importPriceListItemsFromCSV,
  type PriceList,
  type PriceListItem,
} from "../actions";

interface PriceListDetailClientProps {
  initialList: PriceList;
}

export default function PriceListDetailClient({ initialList }: PriceListDetailClientProps) {
  const router = useRouter();
  const [list, setList] = useState<PriceList>(initialList);
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null);
  const [itemForm, setItemForm] = useState<Omit<PriceListItem, "id">>({
    name: "",
    sku: "",
    unit: "",
    tradePrice: undefined,
    shelfPrice: undefined,
    cost: undefined,
    notes: "",
  });
  const [csvContent, setCsvContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setItemForm({
      name: "",
      sku: "",
      unit: "",
      tradePrice: undefined,
      shelfPrice: undefined,
      cost: undefined,
      notes: "",
    });
    setEditingItem(null);
    setError("");
    setSuccess("");
  };

  const handleAddItem = async () => {
    if (!itemForm.name.trim()) {
      setError("Item name is required");
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await addPriceListItem(list.id, itemForm);
      if (result.success) {
        setSuccess("Item added successfully");
        setShowAddModal(false);
        resetForm();
        router.refresh();
      } else {
        setError(result.error || "Failed to add item");
      }
    });
  };

  const handleUpdateItem = async () => {
    if (!editingItem?.id || !itemForm.name.trim()) {
      setError("Item name is required");
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await updatePriceListItem(editingItem.id, itemForm);
      if (result.success) {
        setSuccess("Item updated successfully");
        setShowAddModal(false);
        resetForm();
        router.refresh();
      } else {
        setError(result.error || "Failed to update item");
      }
    });
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await deletePriceListItem(itemId);
      if (result.success) {
        setSuccess("Item deleted successfully");
        router.refresh();
      } else {
        setError(result.error || "Failed to delete item");
      }
    });
  };

  const handleImportCSV = async () => {
    if (!csvContent.trim()) {
      setError("CSV content is required");
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await importPriceListItemsFromCSV(list.id, csvContent);
      if (result.success) {
        setSuccess(`Successfully imported ${result.imported} items`);
        if (result.errors.length > 0) {
          setError(`Some errors occurred: ${result.errors.join(", ")}`);
        }
        setShowImportModal(false);
        setCsvContent("");
        router.refresh();
      } else {
        setError(result.errors.join(", ") || "Failed to import CSV");
      }
    });
  };

  const openEditModal = (item: PriceListItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      sku: item.sku || "",
      unit: item.unit || "",
      tradePrice: item.tradePrice,
      shelfPrice: item.shelfPrice,
      cost: item.cost,
      notes: item.notes || "",
    });
    setShowAddModal(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/pricing"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium mb-4 inline-block"
        >
          ← Back to Price Lists
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{list.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  list.type === "TRADE"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {list.type}
              </span>
              {list.description && (
                <p className="text-sm text-slate-600">{list.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setShowImportModal(true);
              }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Import CSV
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Items Table */}
      {list.items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 mb-4">No items in this list yet.</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add Item
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowImportModal(true);
              }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Import CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Unit
                  </th>
                  {list.type === "TRADE" && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                      Trade Price
                    </th>
                  )}
                  {list.type === "SHELF" && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                      Shelf Price
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.sku || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.unit || "-"}</td>
                    {list.type === "TRADE" && (
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">
                        {item.tradePrice !== undefined ? `$${item.tradePrice.toFixed(2)}` : "-"}
                      </td>
                    )}
                    {list.type === "SHELF" && (
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">
                        {item.shelfPrice !== undefined ? `$${item.shelfPrice.toFixed(2)}` : "-"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      {item.cost !== undefined ? `$${item.cost.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                      {item.notes || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id!, item.name)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                        >
                          Delete
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

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingItem ? "Edit Item" : "Add Item"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Item name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={itemForm.sku}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Product code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Each, Litre, Box"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {list.type === "TRADE" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Trade Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.tradePrice ?? ""}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          tradePrice: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {list.type === "SHELF" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Shelf Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.shelfPrice ?? ""}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          shelfPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.cost ?? ""}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        cost: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                disabled={isPending || !itemForm.name.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? (editingItem ? "Updating..." : "Adding...") : editingItem ? "Update" : "Add"}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={isPending}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Import Items from CSV</h2>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">CSV Format:</p>
              <p className="text-xs text-blue-700 font-mono mb-2">
                name,sku,unit,trade price,shelf price,cost,notes
              </p>
              <p className="text-xs text-blue-700">
                Required: name. Optional: sku, unit, trade price, shelf price, cost, notes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CSV Content</label>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                rows={10}
                placeholder="name,sku,unit,trade price,shelf price,cost,notes&#10;Paint White,PAINT-001,Litre,25.50,35.00,20.00,Interior paint&#10;Brush 2inch,BRUSH-002,Each,12.00,18.00,8.00,Quality brush"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleImportCSV}
                disabled={isPending || !csvContent.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? "Importing..." : "Import"}
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setCsvContent("");
                  setError("");
                }}
                disabled={isPending}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

