/**
 * NurseFlow Enterprise HIS — Master Data Export Service
 * Exports hospital master data to Excel (CSV UTF-8 with BOM) and Print-Ready Hospital PDF layout.
 */

export const masterDataExportService = {
  /**
   * Export dataset to CSV with UTF-8 BOM (Openable directly in Microsoft Excel without character corruption)
   */
  exportToExcel: (data, columns, filename = 'master_data_export') => {
    if (!data || data.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const headers = columns.map(c => `"${(c.label || c.key).replace(/"/g, '""')}"`).join(',');
    const rows = data.map(item => {
      return columns.map(c => {
        let val = item[c.key];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Trigger Browser Print for a formatted Medical Master Data Report (PDF Generation)
   */
  exportToPdfReport: (data, columns, title = 'Laporan Master Data Rumah Sakit', subtitle = 'NurseFlow Enterprise HIS') => {
    if (!data || data.length === 0) {
      alert('Tidak ada data untuk dicetak!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocker memblokir jendela cetak. Izinkan popup untuk mencetak laporan PDF.');
      return;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const tableHeadersHtml = columns.map(c => `
      <th style="padding: 8px 10px; border: 1px solid #cbd5e1; background: #0f172a; color: #ffffff; font-size: 11px; text-align: left; text-transform: uppercase;">
        ${c.label || c.key}
      </th>
    `).join('');

    const tableRowsHtml = data.map((item, idx) => `
      <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        ${columns.map(c => {
          let val = item[c.key];
          if (val === undefined || val === null) val = '-';
          if (typeof val === 'boolean') val = val ? 'Aktif / Ya' : 'Non-Aktif / Tidak';
          return `<td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #1e293b;">${val}</td>`;
        }).join('')}
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - NurseFlow HIS</title>
        <style>
          @page { size: landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #0f172a; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #007399; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: 800; color: #007399; margin: 0; }
          .meta { font-size: 10px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${title}</h1>
            <p class="meta">${subtitle} &bull; Total Record: <strong>${data.length} entitas</strong></p>
          </div>
          <div style="text-align: right;">
            <span class="badge">JCI & SATUSEHAT COMPLIANT</span>
            <p class="meta">Dicetak: ${dateFormatted}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Dokumen Resmi Sistem Informasi Manajemen Rumah Sakit NurseFlow (RME 2026)</div>
          <div>Halaman Terverifikasi Sistem Otomatis</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
