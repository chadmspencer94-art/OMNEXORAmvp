"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createPriceList,
  deletePriceList,
  type PriceList,
  type PriceListType,
} from "./actions";

interface PriceListsClientProps {
  initialLists: PriceList[];
}

export default function PriceListsClient({ initialLists }: PriceListsClientProps) {
  const router = useRouter();
  const [lists, setLists] = useState<PriceList[]>(initialLists);
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    type: "TRADE" as PriceListType,
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setError("Name is required");
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await createPriceList(createForm.name, createForm.type, createForm.description);
      if (result.success && result.id) {
        setSuccess("Price list created successfully");
        setShowCreateModal(false);
        setCreateForm({ name: "", type: "TRADE", description: "" });
        // Refresh the page to get updated lists
        router.refresh();
      } else {
        setError(result.error || "Failed to create price list");
      }
    });
  };

  const handleDelete = async (listId: string, listName: string) => {
    if (!confirm(`Are you sure you want to delete "${listName}"? This will also delete all items in this list.`)) {
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await deletePriceList(listId);
      if (result.success) {
        setSuccess("Price list deleted successfully");
        router.refresh();
      } else {
        setError(result.error || "Failed to delete price list");
      }
    });
  };

  return (
    <div>
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

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {lists.length} {lists.length === 1 ? "list" : "lists"}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Create Price List
        </button>
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 mb-4">No price lists yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Your First Price List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{list.name}</h3>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      list.type === "TRADE"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {list.type}
                  </span>
                </div>
              </div>

              {list.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{list.description}</p>
              )}

              <div className="text-sm text-slate-500 mb-4">
                {list.items.length} {list.items.length === 1 ? "item" : "items"}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/pricing/${list.id}`}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
                >
                  View & Edit
                </Link>
                <button
                  onClick={() => handleDelete(list.id, list.name)}
                  disabled={isPending}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Price List</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Paint Supplies Trade List"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as PriceListType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="TRADE">Trade</option>
                  <option value="SHELF">Shelf</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={isPending || !createForm.name.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ name: "", type: "TRADE", description: "" });
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

