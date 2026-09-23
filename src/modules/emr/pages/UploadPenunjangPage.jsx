import React, { useState, useMemo } from 'react';
import { 
  FileUp, Search, Filter, Eye, Download, Trash2, Plus, 
  CheckCircle2, FileText, Image, AlertCircle, Building2, 
  Calendar, User, Stethoscope, X, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { emrSupportingDocsService } from '../services/emrSupportingDocs.service.js';
import { usePatientStore } from '../../patient/patient.store.js';
import toast from 'react-hot-toast';

export default function UploadPenunjangPage() {
  const navigate = useNavigate();
  const { patients, selectedPatientId } = usePatientStore();
  
  const [documents, setDocuments] = useState(() => emrSupportingDocsService.getDocuments());
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId || p.mrn === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'LABORATORY',
    categoryLabel: 'Laboratorium Klinis',
    documentDate: new Date().toISOString().slice(0, 10),
    facilityOrigin: 'RSUP Nasional - Pusat Rujukan',
    doctorInCharge: 'dr. Hendra Setiawan, Sp.Rad',
    notes: '',
    fileName: '',
    fileSize: ''
  });

  const categories = [
    { id: 'ALL', label: 'Semua Dokumen' },
    { id: 'LABORATORY', label: 'Laboratorium' },
    { id: 'RADIOLOGY', label: 'Radiologi & Imaging' },
    { id: 'ECG', label: 'EKG / Kardio' },
    { id: 'PATHOLOGY', label: 'Patologi Anatomi' },
    { id: 'EXTERNAL_REFERRAL', label: 'Rujukan Luar' }
  ];

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || 
        (doc.title || '').toLowerCase().includes(q) ||
        (doc.patientName || '').toLowerCase().includes(q) ||
        (doc.mrn || '').toLowerCase().includes(q) ||
        (doc.notes || '').toLowerCase().includes(q) ||
        (doc.facilityOrigin || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [documents, selectedCategory, searchQuery]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: `${sizeMB} MB`,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }));
    }
  };

  const handleSaveUpload = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.fileName) {
      toast.error('Judul berkas dan file dokumen wajib disertakan!');
      return;
    }

    const catObj = categories.find(c => c.id === formData.category);
    const newDoc = emrSupportingDocsService.addDocument({
      ...formData,
      categoryLabel: catObj ? catObj.label : formData.category,
      patientId: activePatient?.id || 'P001',
      patientName: activePatient?.name || 'Pasien Umum',
      mrn: activePatient?.mrn || 'MRN-2026-0811',
      uploadedBy: 'Petugas Penunjang Medis'
    });

    setDocuments(prev => [newDoc, ...prev]);
    setIsUploadModalOpen(false);
    toast.success('Dokumen penunjang berhasil diunggah dan disimpan ke EMR!');
    
    // Reset
    setFormData({
      title: '',
      category: 'LABORATORY',
      categoryLabel: 'Laboratorium Klinis',
      documentDate: new Date().toISOString().slice(0, 10),
      facilityOrigin: 'RSUP Nasional - Pusat Rujukan',
      doctorInCharge: 'dr. Hendra Setiawan, Sp.Rad',
      notes: '',
      fileName: '',
      fileSize: ''
    });
  };

  const handleDelete = (docId) => {
    if (window.confirm('Hapus dokumen penunjang ini dari rekam medis?')) {
      emrSupportingDocsService.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success('Dokumen penunjang dihapus.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/emr')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Kembali ke EMR Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#015C80] text-white flex items-center justify-center font-black shadow-md shadow-[#015C80]/30">
            <FileUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Upload Dokumen Penunjang
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[10px] font-black uppercase">
                Permenkes 24/2022
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Integrasi Digital Berkas Diagnostik (Laboratorium, Radiologi, EKG, Patologi, dan Rujukan Luar)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/patient-chart')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Buka Patient Chart</span>
          </button>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-[#015C80] hover:bg-[#014c6a] text-white flex items-center gap-2 shadow-md shadow-[#015C80]/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Unggah Dokumen Baru</span>
          </button>
        </div>
      </div>

      {/* Patient Ribbon Context */}
      {activePatient && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-900 border border-blue-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
              {activePatient.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white">{activePatient.name}</span>
                <span className="font-mono text-slate-500 font-bold">({activePatient.mrn || activePatient.id})</span>
              </div>
              <span className="text-[11px] text-slate-500">Pasien Terhubung Aktif untuk Pengunggahan Berkas Medis</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-black uppercase">
            STATUS: ACTIVE ENCOUNTER
          </span>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#015C80] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul, pasien, catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#015C80]"
          />
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300">Belum ada dokumen penunjang yang cocok</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Klik tombol "Unggah Dokumen Baru" untuk menambahkan hasil laboratorium, citra radiologi, atau berkas rujukan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Dokumen & Berkas</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Pasien & No. RM</th>
                  <th className="p-4">Asal Instansi & DPJP</th>
                  <th className="p-4">Tanggal Periksa</th>
                  <th className="p-4">Catatan Klinis</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center justify-center shrink-0">
                          {doc.fileName?.endsWith('.jpg') || doc.fileName?.endsWith('.png') ? (
                            <Image className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">{doc.title}</p>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {doc.fileName} • {doc.fileSize}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                        {doc.categoryLabel}
                      </span>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900 dark:text-white">{doc.patientName}</p>
                      <span className="font-mono text-[10px] text-slate-400">{doc.mrn}</span>
                    </td>

                    <td className="p-4">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{doc.facilityOrigin}</p>
                      <span className="text-[10px] text-slate-500 block">{doc.doctorInCharge}</span>
                    </td>

                    <td className="p-4 whitespace-nowrap font-mono text-[11px]">
                      {doc.documentDate}
                    </td>

                    <td className="p-4 max-w-xs truncate text-[11px] text-slate-500" title={doc.notes}>
                      {doc.notes || '-'}
                    </td>

                    <td className="p-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 cursor-pointer"
                          title="Lihat Pratinjau Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.success(`Mengunduh berkas ${doc.fileName}...`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                          title="Unduh Berkas"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 cursor-pointer"
                          title="Hapus Berkas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Upload Berkas Baru */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#015C80] text-white flex items-center justify-center">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Unggah Dokumen Penunjang Baru</h3>
                <p className="text-[11px] text-slate-400">Hubungkan berkas pemeriksaan ke rekam medis pasien</p>
              </div>
            </div>

            <form onSubmit={handleSaveUpload} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Pilih Berkas (PDF, JPEG, PNG, DICOM) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.dcm"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#015C80] file:text-white cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Judul Dokumen Penunjang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Hasil Rontgen Thorax PA, Lab Darah Lengkap"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:border-[#015C80]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Kategori Dokumen</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="LABORATORY">Laboratorium Klinis</option>
                    <option value="RADIOLOGY">Radiologi & Imaging</option>
                    <option value="ECG">EKG / Elektromedik</option>
                    <option value="PATHOLOGY">Patologi Anatomi</option>
                    <option value="EXTERNAL_REFERRAL">Rujukan Luar Faskes</option>
                    <option value="OTHER">Lain-lain / Dokumen Klinis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Tanggal Pemeriksaan</label>
                  <input
                    type="date"
                    value={formData.documentDate}
                    onChange={(e) => setFormData(p => ({ ...p, documentDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Instansi / Unit Asal</label>
                  <input
                    type="text"
                    value={formData.facilityOrigin}
                    onChange={(e) => setFormData(p => ({ ...p, facilityOrigin: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Dokter Pemeriksa / DPJP</label>
                  <input
                    type="text"
                    value={formData.doctorInCharge}
                    onChange={(e) => setFormData(p => ({ ...p, doctorInCharge: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Catatan / Ringkasan Hasil Klinis</label>
                <textarea
                  rows={2}
                  placeholder="Kesan diagnosis atau temuan kritis..."
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:border-[#015C80]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#015C80] hover:bg-[#014c6a] text-white font-black shadow-md shadow-[#015C80]/30"
                >
                  Simpan ke EMR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#015C80] text-white flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{previewDoc.title}</h3>
                <p className="text-xs text-slate-400">
                  {previewDoc.categoryLabel} • Tanggal: {previewDoc.documentDate} • {previewDoc.fileName}
                </p>
              </div>
            </div>

            {/* Document Viewer Box */}
            <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center min-h-[260px] gap-3">
              <FileText className="w-16 h-16 text-[#015C80] animate-bounce" />
              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                Pratinjau Dokumen Rekam Medis Terverifikasi
              </p>
              <p className="text-xs text-slate-500 max-w-md">
                Berkas: <strong className="text-slate-900 dark:text-white">{previewDoc.fileName}</strong> ({previewDoc.fileSize})
              </p>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left w-full text-xs space-y-1">
                <p><strong>Pasien:</strong> {previewDoc.patientName} ({previewDoc.mrn})</p>
                <p><strong>Asal Faskes:</strong> {previewDoc.facilityOrigin}</p>
                <p><strong>Dokter Pemeriksa:</strong> {previewDoc.doctorInCharge}</p>
                <p><strong>Temuan / Catatan:</strong> {previewDoc.notes || 'Tidak ada catatan tambahan.'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400 font-mono text-[10px]">
                ID Dokumen: {previewDoc.id} • Status: VERIFIED EMR
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toast.success('Mengunduh berkas fisik...')}
                  className="px-4 py-2 rounded-xl bg-[#015C80] text-white font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
