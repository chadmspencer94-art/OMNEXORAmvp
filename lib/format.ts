/**
 * Formats a date/time for display in Australian format
 */
export function formatDateTimeForDisplay(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "";
  }
  
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dateObj);
}

/**
 * Formats a date for datetime-local input (YYYY-MM-DDTHH:mm)
 */
export function formatDateTimeForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "";
  }
  
  // Get local timezone offset and adjust
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats just the date (without time) for display
 */
export function formatDateForDisplay(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "";
  }
  
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(dateObj);
}

