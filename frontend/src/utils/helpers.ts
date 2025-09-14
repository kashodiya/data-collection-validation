






/**
 * Format a date string to a more readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a number with commas for thousands
 * @param value - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number | string): string => {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('en-US');
};

/**
 * Truncate a string to a specified length
 * @param str - String to truncate
 * @param length - Maximum length
 * @returns Truncated string
 */
export const truncateString = (str: string, length: number = 50): string => {
  if (!str) return '';
  if (str.length <= length) return str;
  
  return `${str.substring(0, length)}...`;
};

/**
 * Convert a camelCase string to Title Case
 * @param camelCase - camelCase string
 * @returns Title Case string
 */
export const camelCaseToTitleCase = (camelCase: string): string => {
  if (!camelCase) return '';
  
  const result = camelCase.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

/**
 * Get a color based on status
 * @param status - Status string
 * @returns Color string
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'submitted':
      return '#1976d2'; // blue
    case 'validated':
      return '#2e7d32'; // green
    case 'failed':
      return '#d32f2f'; // red
    case 'pending':
      return '#ed6c02'; // orange
    default:
      return '#757575'; // grey
  }
};

/**
 * Download data as a CSV file
 * @param data - Array of objects
 * @param filename - Name of the file
 */
export const downloadCSV = (data: any[], filename: string): void => {
  if (!data || !data.length) return;
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV format
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // Create and download the file
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};






