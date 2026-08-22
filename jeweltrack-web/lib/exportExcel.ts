import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], filename: string, sheetName = 'Sheet1') {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths based on maximum content length
  const keys = Object.keys(data[0]);
  const colWidths = keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => (row[key] ? String(row[key]).length : 0)),
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 50) };
  });
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate file name with current date
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${filename}_${dateStr}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, fullFileName);
}

export function exportToCsv(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.setAttribute('download', `${filename}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
