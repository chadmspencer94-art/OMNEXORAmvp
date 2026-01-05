"use client";

import { useState, useCallback } from "react";
import type { RenderModel, RenderSection, RenderField, RenderTable } from "@/lib/docEngine/types";

interface DocPreviewProps {
  model: RenderModel;
  onModelChange?: (updatedModel: RenderModel) => void;
  editable?: boolean;
}

export default function DocPreview({ model: initialModel, onModelChange, editable = true }: DocPreviewProps) {
  const [model, setModel] = useState<RenderModel>(initialModel);

  const updateField = useCallback((sectionId: string, fieldId: string, value: string | number | null) => {
    const updatedModel: RenderModel = {
      ...model,
      sections: model.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          fields: section.fields?.map((field) => {
            if (field.id !== fieldId) return field;
            return { ...field, value };
          }),
        };
      }),
    };
    setModel(updatedModel);
    onModelChange?.(updatedModel);
  }, [model, onModelChange]);

  const updateTableRow = useCallback((sectionId: string, rowIndex: number, columnId: string, value: string | number | null) => {
    const updatedModel: RenderModel = {
      ...model,
      sections: model.sections.map((section) => {
        if (section.id !== sectionId || !section.table) return section;
        return {
          ...section,
          table: {
            ...section.table,
            rows: section.table.rows.map((row, idx) => {
              if (idx !== rowIndex) return row;
              return { ...row, [columnId]: value };
            }),
          },
        };
      }),
    };
    setModel(updatedModel);
    onModelChange?.(updatedModel);
  }, [model, onModelChange]);

  const addTableRow = useCallback((sectionId: string) => {
    const updatedModel: RenderModel = {
      ...model,
      sections: model.sections.map((section) => {
        if (section.id !== sectionId || !section.table) return section;
        const newRow: Record<string, any> = {};
        section.table.columns.forEach((col) => {
          newRow[col.id] = null;
        });
        return {
          ...section,
          table: {
            ...section.table,
            rows: [...section.table.rows, newRow],
          },
        };
      }),
    };
    setModel(updatedModel);
    onModelChange?.(updatedModel);
  }, [model, onModelChange]);

  const removeTableRow = useCallback((sectionId: string, rowIndex: number) => {
    const updatedModel: RenderModel = {
      ...model,
      sections: model.sections.map((section) => {
        if (section.id !== sectionId || !section.table) return section;
        return {
          ...section,
          table: {
            ...section.table,
            rows: section.table.rows.filter((_, idx) => idx !== rowIndex),
          },
        };
      }),
    };
    setModel(updatedModel);
    onModelChange?.(updatedModel);
  }, [model, onModelChange]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{model.title}</h1>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>Record ID: <span className="font-mono font-medium">{model.recordId}</span></span>
          <span>Generated: <span className="font-medium">{new Date(model.timestamp).toLocaleString("en-AU")}</span></span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-900">{model.disclaimer}</p>
        </div>
      </div>

      {/* Sections */}
      {model.sections.map((section) => (
        <SectionPreview
          key={section.id}
          section={section}
          editable={editable}
          onFieldChange={(fieldId, value) => updateField(section.id, fieldId, value)}
          onTableRowChange={(rowIndex, columnId, value) => updateTableRow(section.id, rowIndex, columnId, value)}
          onAddTableRow={() => addTableRow(section.id)}
          onRemoveTableRow={(rowIndex) => removeTableRow(section.id, rowIndex)}
        />
      ))}
    </div>
  );
}

interface SectionPreviewProps {
  section: RenderSection;
  editable?: boolean;
  onFieldChange?: (fieldId: string, value: string | number | null) => void;
  onTableRowChange?: (rowIndex: number, columnId: string, value: string | number | null) => void;
  onAddTableRow?: () => void;
  onRemoveTableRow?: (rowIndex: number) => void;
}

function SectionPreview({
  section,
  editable = true,
  onFieldChange,
  onTableRowChange,
  onAddTableRow,
  onRemoveTableRow,
}: SectionPreviewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
        {section.title}
      </h2>

      {/* Fields */}
      {section.fields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.fields.map((field) => (
            <FieldPreview
              key={field.id}
              field={field}
              editable={editable}
              onChange={(value) => onFieldChange?.(field.id, value)}
            />
          ))}
        </div>
      )}

      {/* Table */}
      {section.table && (
        <TablePreview
          table={section.table}
          editable={editable}
          onRowChange={onTableRowChange}
          onAddRow={onAddTableRow}
          onRemoveRow={onRemoveTableRow}
        />
      )}
    </div>
  );
}

interface FieldPreviewProps {
  field: RenderField;
  editable?: boolean;
  onChange?: (value: string | number | null) => void;
}

function FieldPreview({ field, editable = true, onChange }: FieldPreviewProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value, type } = e.target;
    if (type === "number") {
      const num = value === "" ? null : parseFloat(value);
      onChange?.(isNaN(num!) ? null : num);
    } else {
      onChange?.(value === "" ? null : value);
    }
  };

  if (!editable) {
    const displayValue = field.value !== null && field.value !== undefined && field.value !== ""
      ? String(field.value)
      : field.placeholder || "—";

    return (
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className={`text-sm text-slate-900 ${field.value === null || field.value === "" ? "text-slate-400 italic" : ""}`}>
          {displayValue}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={field.id} className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={field.id}
          value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
          onChange={handleChange}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y min-h-[80px]"
          rows={4}
        />
      ) : field.type === "select" ? (
        <select
          id={field.id}
          value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
        >
          <option value="">Select...</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={field.id}
          type={field.type === "date" ? "date" : field.type === "number" || field.type === "currency" ? "number" : "text"}
          value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
          onChange={handleChange}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          step={field.type === "currency" ? "0.01" : undefined}
        />
      )}
    </div>
  );
}

interface TablePreviewProps {
  table: RenderTable;
  editable?: boolean;
  onRowChange?: (rowIndex: number, columnId: string, value: string | number | null) => void;
  onAddRow?: () => void;
  onRemoveRow?: (rowIndex: number) => void;
}

function TablePreview({ table, editable = true, onRowChange, onAddRow, onRemoveRow }: TablePreviewProps) {
  const handleCellChange = (rowIndex: number, columnId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, type } = e.target;
    if (type === "number") {
      const num = value === "" ? null : parseFloat(value);
      onRowChange?.(rowIndex, columnId, isNaN(num!) ? null : num);
    } else {
      onRowChange?.(rowIndex, columnId, value === "" ? null : value);
    }
  };

  if (table.rows.length === 0 && !editable) {
    return (
      <div className="text-sm text-slate-500 italic py-4">
        No items added yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-200 rounded-lg">
          <thead className="bg-amber-500">
            <tr>
              {table.columns.map((column) => (
                <th
                  key={column.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-b border-amber-600"
                  style={{ width: column.width ? `${column.width}%` : "auto" }}
                >
                  {column.label}
                </th>
              ))}
              {editable && <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-b border-amber-600 w-16">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {table.rows.length === 0 ? (
              <tr>
                <td colSpan={table.columns.length + (editable ? 1 : 0)} className="px-4 py-8 text-center text-sm text-slate-500">
                  No items added yet
                </td>
              </tr>
            ) : (
              table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50">
                  {table.columns.map((column) => (
                    <td
                      key={column.id}
                      className="px-4 py-3 text-sm border-r border-slate-200 last:border-r-0"
                    >
                      {editable ? (
                        <input
                          type={column.type === "date" ? "date" : column.type === "number" || column.type === "currency" ? "number" : "text"}
                          value={row[column.id] !== null && row[column.id] !== undefined ? String(row[column.id]) : ""}
                          onChange={(e) => handleCellChange(rowIndex, column.id, e)}
                          placeholder={column.label}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                          step={column.type === "currency" ? "0.01" : undefined}
                        />
                      ) : (
                        <span className="text-slate-900">
                          {row[column.id] !== null && row[column.id] !== undefined && row[column.id] !== ""
                            ? String(row[column.id])
                            : "—"}
                        </span>
                      )}
                    </td>
                  ))}
                  {editable && (
                    <td className="px-4 py-3 text-sm border-r border-slate-200">
                      <button
                        onClick={() => onRemoveRow?.(rowIndex)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                        disabled={table.rows.length <= table.minRows}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {editable && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => onAddRow?.()}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Row
          </button>
          {table.rows.length < table.minRows && (
            <p className="text-xs text-amber-600">
              Minimum {table.minRows} row{table.minRows !== 1 ? "s" : ""} required
            </p>
          )}
        </div>
      )}
      {!editable && table.rows.length < table.minRows && (
        <p className="text-xs text-amber-600">
          Minimum {table.minRows} row{table.minRows !== 1 ? "s" : ""} required
        </p>
      )}
    </div>
  );
}

