/**
 * Export utilities for Google Sheets / Excel (CSV) & Google Docs / Word (.doc)
 */

/**
 * Export data to Google Sheets / Excel compatible CSV with UTF-8 BOM
 */
export const exportToGoogleSheetsCSV = (
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) => {
  // Add UTF-8 BOM for proper Vietnamese character rendering in Excel & Google Sheets
  const BOM = '\uFEFF';

  const escapeCSV = (field: any) => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCSV).join(',');
  const rowLines = rows.map(row => row.map(escapeCSV).join(','));

  const csvContent = BOM + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export rich HTML content to a Word / Google Docs compatible file (.doc)
 */
export const exportToGoogleDocs = (
  title: string,
  contentHtml: string
) => {
  const fullHtml = `
    <!語 html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #111827; padding: 20px; }
        h1 { color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
        h2 { color: #1e293b; margin-top: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        th { background-color: #f1f5f9; font-weight: bold; }
        .badge { background-color: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p><i>Xuất từ Hệ thống Tiếng Nhật TNQDO - ${new Date().toLocaleDateString('vi-VN')}</i></p>
      <hr/>
      ${contentHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + fullHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
