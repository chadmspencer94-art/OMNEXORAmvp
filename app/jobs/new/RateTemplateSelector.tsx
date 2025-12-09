"use client";

import { useState, useEffect } from "react";

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
}

interface RateTemplateSelectorProps {
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string | null) => void;
  tradeType: string;
  propertyType: string;
  onRatesChange?: (rates: {
    labourRatePerHour: number | null;
    helperRatePerHour: number | null;
  }) => void;
}

export default function RateTemplateSelector({
  selectedTemplateId,
  onTemplateSelect,
  tradeType,
  propertyType,
  onRatesChange,
}: RateTemplateSelectorProps) {
  const [templates, setTemplates] = useState<RateTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Auto-select default template if none selected
    if (!selectedTemplateId && templates.length > 0) {
      const defaultTemplate = templates.find((t) => t.isDefault);
      if (defaultTemplate) {
        // Check if template matches trade/property type constraints
        const matchesTrade = !defaultTemplate.tradeType || defaultTemplate.tradeType === tradeType;
        const matchesProperty = !defaultTemplate.propertyType || defaultTemplate.propertyType === propertyType;
        if (matchesTrade && matchesProperty) {
          handleTemplateSelect(defaultTemplate.id);
        }
      }
    }
  }, [templates, tradeType, propertyType]);

  useEffect(() => {
    // When template changes, update rates
    if (selectedTemplateId && onRatesChange) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        onRatesChange({
          labourRatePerHour: template.hourlyRate,
          helperRatePerHour: template.helperHourlyRate,
        });
      }
    }
  }, [selectedTemplateId, templates, onRatesChange]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rate-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch rate templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string | null) => {
    onTemplateSelect(templateId);
    if (templateId && onRatesChange) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        onRatesChange({
          labourRatePerHour: template.hourlyRate,
          helperRatePerHour: template.helperHourlyRate,
        });
      }
    } else if (!templateId && onRatesChange) {
      // Clear rates when "No template" is selected
      onRatesChange({
        labourRatePerHour: null,
        helperRatePerHour: null,
      });
    }
  };

  // Filter templates that match current trade/property type
  const matchingTemplates = templates.filter((t) => {
    const matchesTrade = !t.tradeType || t.tradeType === tradeType;
    const matchesProperty = !t.propertyType || t.propertyType === propertyType;
    return matchesTrade && matchesProperty;
  });

  // Show all templates if no matches, but mark them
  const displayTemplates = matchingTemplates.length > 0 ? matchingTemplates : templates;

  if (isLoading) {
    return null;
  }

  if (templates.length === 0) {
    return (
      <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-xs text-slate-600">
          No rate templates yet. <a href="/settings/rates" className="text-amber-600 hover:text-amber-700 underline">Create one</a> to quickly apply consistent rates.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Rate Template <span className="text-slate-400 font-normal">(optional)</span>
      </label>
      <select
        value={selectedTemplateId || ""}
        onChange={(e) => handleTemplateSelect(e.target.value || null)}
        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white text-sm"
      >
        <option value="">No template (use business defaults)</option>
        {displayTemplates.map((template) => {
          const isMatching = matchingTemplates.includes(template);
          const label = `${template.name}${template.isDefault ? " (Default)" : ""}${!isMatching ? " (may not match trade/property type)" : ""}`;
          return (
            <option key={template.id} value={template.id}>
              {label}
            </option>
          );
        })}
      </select>
      {selectedTemplateId && (
        <p className="mt-1 text-xs text-slate-500">
          Rates from template will be pre-filled. You can adjust them below.
        </p>
      )}
    </div>
  );
}

