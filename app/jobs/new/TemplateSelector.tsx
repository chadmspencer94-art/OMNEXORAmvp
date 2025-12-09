"use client";

import { useState, useEffect } from "react";
import { Bookmark, Loader2, X, ChevronDown } from "lucide-react";

interface JobTemplate {
  id: string;
  title: string;
  tradeType: string;
  propertyType: string;
  notes: string | null;
  addressLine1: string | null;
  suburb: string | null;
  postcode: string | null;
}

interface TemplateSelectorProps {
  onSelectTemplate: (template: JobTemplate | null) => void;
  selectedTemplateId: string | null;
}

export default function TemplateSelector({ onSelectTemplate, selectedTemplateId }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && templates.length === 0) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/job-templates");
      if (!response.ok) {
        throw new Error("Failed to load templates");
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message || "Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: JobTemplate | null) => {
    onSelectTemplate(template);
    setIsOpen(false);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Start from:</label>
        <div className="relative flex-1 max-w-md">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            <span className={selectedTemplate ? "text-slate-900" : "text-slate-500"}>
              {selectedTemplate ? selectedTemplate.title : "Start from scratch"}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate(null)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Start from scratch
                  </button>
                  {isLoading && (
                    <div className="p-4 text-center">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500 mx-auto" />
                    </div>
                  )}
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                      {error}
                    </div>
                  )}
                  {!isLoading && !error && templates.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No templates yet. Save a job as a template to reuse it.
                    </div>
                  )}
                  {!isLoading && !error && templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0"
                    >
                      <div className="font-medium text-slate-900">{template.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {template.tradeType} • {template.propertyType}
                        {template.notes && (
                          <span className="block mt-1 line-clamp-1">{template.notes.substring(0, 60)}...</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

