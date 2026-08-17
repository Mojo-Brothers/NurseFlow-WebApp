/**
 * NurseFlow Enterprise HIS — Master Data Import Service
 * Handles CSV / JSON file reading, header parsing, validation against entity schema,
 * duplicate detection, and batch payload preparation.
 */

export const masterDataImportService = {
  /**
   * Parse CSV File Text to JSON Objects
   */
  parseCsv: (csvText) => {
    const lines = csvText
      .split(/\r\n|\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) {
      throw new Error('File CSV kosong atau tidak memiliki baris data.');
    }

    // Parse Headers
    const headers = parseCsvLine(lines[0]);
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      if (values.length === headers.length) {
        const item = {};
        headers.forEach((h, index) => {
          let val = values[index];
          // Simple type cast
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (!isNaN(val) && val.trim() !== '' && !val.startsWith('0') && val.length < 10) {
            val = Number(val);
          }
          item[h] = val;
        });
        records.push(item);
      }
    }

    return { headers, records };
  },

  /**
   * Validate records against entity columns & detect duplicates
   */
  validateImport: (records, entityConfig, existingData = []) => {
    const errors = [];
    const validatedRecords = [];
    const existingCodeSet = new Set(existingData.map(d => d[entityConfig.codeField]?.toLowerCase()));

    records.forEach((record, index) => {
      const rowNum = index + 2; // Line 1 is header
      const rowErrors = [];

      // Check required name or code field
      const codeVal = record[entityConfig.codeField] || record.code || record.kode;
      const nameVal = record[entityConfig.nameField] || record.name || record.nama;

      if (!nameVal && !codeVal) {
        rowErrors.push(`Baris ${rowNum}: Nama atau Kode entitas tidak boleh kosong.`);
      }

      if (codeVal && existingCodeSet.has(String(codeVal).toLowerCase())) {
        rowErrors.push(`Baris ${rowNum}: Kode '${codeVal}' sudah terdaftar dalam sistem (Duplikasi).`);
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        // Normalize record keys if mapped from Indonesian headers
        const normalized = { ...record };
        if (!normalized[entityConfig.codeField] && codeVal) {
          normalized[entityConfig.codeField] = codeVal;
        }
        if (!normalized[entityConfig.nameField] && nameVal) {
          normalized[entityConfig.nameField] = nameVal;
        }
        normalized.status = normalized.status || 'ACTIVE';
        validatedRecords.push(normalized);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validRecords: validatedRecords,
      totalParsed: records.length,
      validCount: validatedRecords.length
    };
  }
};

// Helper to parse a single CSV line taking quotes into account
function parseCsvLine(text) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
