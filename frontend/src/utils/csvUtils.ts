/**
 * Utility to export an array of objects to a CSV file
 * @param data Array of objects to export
 * @param headers Array of header labels and their corresponding keys in the data objects
 * @param fileName Name of the file to download (without extension)
 */
export const exportToCSV = (data: any[], headers: { label: string; key: string }[], fileName: string) => {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }

  const csvRows = [];

  // 1. Add headers
  csvRows.push(headers.map(header => `"${header.label.replace(/"/g, '""')}"`).join(','));

  // 2. Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      let val = row;
      
      // Handle nested properties (e.g., "employee.name")
      const keys = header.key.split('.');
      for (const k of keys) {
        val = val ? val[k] : '';
      }

      // Format based on type if needed (e.g., Date strings)
      let formattedVal = val;
      if (val instanceof Date) {
        formattedVal = val.toLocaleDateString();
      }

      // Ensure it's a string and escape quotes
      const strVal = String(formattedVal ?? '').replace(/"/g, '""');
      return `"${strVal}"`;
    });
    csvRows.push(values.join(','));
  }

  // 3. Create Blob and trigger download
  const csvString = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};