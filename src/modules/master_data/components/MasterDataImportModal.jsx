import React, { useState, useRef } from 'react';
import { useMasterDataStore } from '../masterData.store.js';
import { MASTER_DATA_ENTITIES } from '../data/masterDataSchemas.js';
import { masterDataImportService } from '../services/masterDataImport.service.js';
import { useAuth } from '../../../contexts/useAuth.js';

export default function MasterDataImportModal() {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || 'admin@nurseflow.id';

  const {
    activeEntity,
    isImportModalOpen,
    closeImportModal,
    entitiesData,
    importBatchRecords,
    isLoading
  } = useMasterDataStore();

  const fileInputRef = useRef(null);
  const config = MASTER_DATA_ENTITIES[activeEntity] || {};
  const currentData = entitiesData[activeEntity] || [];

  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [importError, setImportError] = useState('');

  if (!isImportModalOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportError('');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let records = [];

        if (file.name.endsWith('.json')) {
          records = JSON.parse(text);
          if (!Array.isArray(records)) throw new Error('File JSON harus berupa array objek data.');
        } else {
          const parsed = masterDataImportService.parseCsv(text);
          records = parsed.records;
        }

        setParsedData(records);
        const result = masterDataImportService.validateImport(records, config, currentData);
        setValidationResult(result);
      } catch (err) {
        setImportError(`Gagal membaca file: ${err.message}`);
        setParsedData(null);
        setValidationResult(null);
      }
    };

    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validRecords.length === 0) return;

    try {
      await importBatchRecords(validationResult.validRecords, userEmail);
    } catch (err) {
      setImportError(`Gagal melakukan impor batch: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-high w-full max-w-3xl rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
            </div>
            <div>
              <h3 className="text-lg font-headline font-black text-on-surface">
                Impor Data Batch: {config.title}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                Mendukung format file CSV (Excel) atau JSON dengan validasi skema otomatis.
              </p>
            </div>
          </div>

          <button
            onClick={closeImportModal}
            className="p-2 rounded-xl text-on-surface-variant hover:text-rose-600 hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          {/* File Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-outline-variant/50 hover:border-primary rounded-3xl p-8 text-center cursor-pointer transition-all bg-surface-container/30 hover:bg-primary/5 flex flex-col items-center justify-center gap-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.json,.txt"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">cloud_upload</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">
                {fileName ? fileName : 'Pilih file CSV / JSON untuk diunggah'}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Klik untuk memilih berkas dari komputer Anda (Format Excel CSV dengan delimiter koma).
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {importError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{importError}</span>
            </div>
          )}

          {/* Validation Result Box */}
          {validationResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Total Terbaca</p>
                  <p className="text-xl font-headline font-black text-on-surface">{validationResult.totalParsed}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Valid & Siap Impor</p>
                  <p className="text-xl font-headline font-black text-emerald-600">{validationResult.validCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <p className="text-[10px] font-bold text-rose-600 uppercase">Error / Duplikasi</p>
                  <p className="text-xl font-headline font-black text-rose-600">{validationResult.errors.length}</p>
                </div>
              </div>

              {/* Error Details */}
              {validationResult.errors.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 max-h-36 overflow-y-auto space-y-1 text-xs text-rose-600">
                  <p className="font-bold flex items-center gap-1 mb-2">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    Peringatan Validasi Data:
                  </p>
                  {validationResult.errors.map((err, i) => (
                    <div key={i} className="font-mono text-[11px]">&bull; {err}</div>
                  ))}
                </div>
              )}

              {/* Preview Table */}
              {validationResult.validRecords.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-on-surface">Pratinjau Data Valid (5 Baris Pertama):</p>
                  <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/30 bg-surface-container-high">
                          {config.columns?.slice(0, 4).map(c => (
                            <th key={c.key} className="p-2.5 font-bold text-on-surface-variant uppercase text-[10px]">
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {validationResult.validRecords.slice(0, 5).map((r, i) => (
                          <tr key={i}>
                            {config.columns?.slice(0, 4).map(c => (
                              <td key={c.key} className="p-2.5 text-on-surface truncate max-w-[150px]">
                                {r[c.key] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/20 bg-surface-container/50 flex items-center justify-between">
          <button
            type="button"
            onClick={closeImportModal}
            className="px-5 py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-highest transition-colors"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={isLoading || !validationResult || validationResult.validCount === 0}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-extrabold text-xs shadow-md shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>
              {isLoading ? 'Memproses Impor...' : `Impor ${validationResult?.validCount || 0} Data Valid`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
