"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";

interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  kind: string;
  caption: string | null;
  createdAt: string;
}

interface AttachmentsSectionProps {
  jobId: string;
}

export default function AttachmentsSection({ jobId }: AttachmentsSectionProps) {
  const router = useRouter();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");

  // Load attachments
  useEffect(() => {
    loadAttachments();
  }, [jobId]);

  const loadAttachments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/jobs/${jobId}/attachments`);
      if (!response.ok) {
        throw new Error("Failed to load attachments");
      }
      const data = await response.json();
      setAttachments(data.attachments || []);
    } catch (err: any) {
      setError(err.message || "Failed to load attachments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("File size must be less than 2MB");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      const response = await fetch(`/api/jobs/${jobId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload attachment");
      }

      // Reset form and reload
      setSelectedFile(null);
      setCaption("");
      setShowUploadForm(false);
      await loadAttachments();
    } catch (err: any) {
      setError(err.message || "Failed to upload attachment");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateCaption = async (attachmentId: string) => {
    try {
      const response = await fetch(
        `/api/jobs/${jobId}/attachments/${attachmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caption: editingCaption.trim() || null }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update caption");
      }

      setEditingCaptionId(null);
      setEditingCaption("");
      await loadAttachments();
    } catch (err: any) {
      setError(err.message || "Failed to update caption");
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/jobs/${jobId}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete attachment");
      }

      await loadAttachments();
    } catch (err: any) {
      setError(err.message || "Failed to delete attachment");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAttachmentUrl = (attachmentId: string) => {
    return `/api/jobs/${jobId}/attachments/${attachmentId}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Attachments</h2>
            <p className="text-xs text-slate-500 mt-1">
              Upload photos or documents to keep everything in one place
            </p>
          </div>
          {!showUploadForm && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Attachment
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Upload Form */}
        {showUploadForm && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="file-input"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Select File (max 2MB)
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-500 file:text-slate-900 hover:file:bg-amber-400 file:cursor-pointer"
                  disabled={isUploading}
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-slate-600">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="caption-input"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Caption (optional)
                </label>
                <input
                  id="caption-input"
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g., Front elevation – cracked render"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
                  disabled={isUploading}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Captions help AI understand context when generating quotes
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowUploadForm(false);
                    setSelectedFile(null);
                    setCaption("");
                    setError(null);
                  }}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attachments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Upload className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No attachments yet</p>
            {!showUploadForm && (
              <button
                onClick={() => setShowUploadForm(true)}
                className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                Upload your first attachment
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Thumbnail/Icon */}
                <div className="mb-3">
                  {attachment.kind === "IMAGE" ? (
                    <a
                      href={getAttachmentUrl(attachment.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-video bg-slate-100 rounded-lg overflow-hidden"
                    >
                      <img
                        src={getAttachmentUrl(attachment.id)}
                        alt={attachment.caption || attachment.fileName}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ) : (
                    <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(attachment.fileSize)} • {attachment.kind}
                      </p>
                    </div>
                  </div>

                  {/* Caption */}
                  {editingCaptionId === attachment.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingCaption}
                        onChange={(e) => setEditingCaption(e.target.value)}
                        placeholder="Add a caption..."
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateCaption(attachment.id)}
                          className="flex-1 px-2 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 rounded transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCaptionId(null);
                            setEditingCaption("");
                          }}
                          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {attachment.caption ? (
                        <p className="text-xs text-slate-600 mb-1">{attachment.caption}</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No caption</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={getAttachmentUrl(attachment.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </a>
                    {editingCaptionId !== attachment.id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingCaptionId(attachment.id);
                            setEditingCaption(attachment.caption || "");
                          }}
                          className="p-1 text-slate-500 hover:text-amber-600 transition-colors"
                          title="Edit caption"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(attachment.id)}
                          className="p-1 text-slate-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

