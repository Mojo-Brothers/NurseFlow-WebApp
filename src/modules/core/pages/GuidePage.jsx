import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import emergencyTriageMd from '../../../assets/docs/emergency-triage.md?raw';
import scenarioIgdMd from '../../../assets/docs/scenario-igd-stemi.md?raw';
import scenarioPoliMd from '../../../assets/docs/scenario-poli-routine.md?raw';

const MarkdownViewer = ({ content }) => {
  if (!content) {
    return (
      <div className="p-8 text-center text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant border-dashed">
        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">description</span>
        <p>Konten panduan sedang dimuat atau tidak ditemukan.</p>
        <p className="text-xs mt-2 opacity-70">Coba muat ulang halaman (F5) jika pesan ini terus muncul.</p>
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none prose-slate dark:prose-invert 
                    prose-headings:font-black prose-headings:tracking-tight 
                    prose-a:text-primary hover:prose-a:text-primary-container
                    prose-img:rounded-2xl prose-img:shadow-lg">
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-3xl font-black text-primary mb-4 pb-2 border-b border-outline-variant" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-on-surface mt-8 mb-3 border-b border-outline-variant/50 pb-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xl font-bold text-on-surface mt-6 mb-2" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-lg font-bold text-on-surface mt-4 mb-2" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-on-surface-variant" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-on-surface-variant" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-on-surface-variant" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold text-on-surface" {...props} />,
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-xl italic text-on-surface-variant mb-4" {...props} />
          ),
          hr: ({node, ...props}) => <hr className="my-8 border-outline-variant" {...props} />,
          code: ({node, inline, className, children, ...props}) => (
            <code className={`${className} bg-surface-container px-1.5 py-0.5 rounded text-primary font-mono text-xs`} {...props}>
              {children}
            </code>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const GUIDE_SECTIONS = [
  {
    id: 'general',
    title: 'Ringkasan Umum',
    icon: 'info',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-primary mb-2">Selamat Datang di NurseFlow HIS</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            NurseFlow adalah Sistem Informasi Rumah Sakit (HIS) berstandar JCI yang dirancang untuk kecepatan, akurasi, dan keselamatan pasien (Patient Safety). 
            Sistem ini menggunakan filosofi desain "Clinical Obsidian" dengan prinsip High-Information Density, mengurangi kebutuhan klik dan scroll demi efisiensi tenaga medis.
          </p>
        </div>
        
        <div className="prose prose-sm max-w-none prose-slate dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary-container p-5 bg-primary-container text-on-primary-container rounded-2xl border border-primary/20 shadow-sm">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">gpp_good</span> Standar JCI & Keamanan
          </h4>
          <ul className="list-disc pl-5 text-sm space-y-2">
            <li><strong>Double Identifier:</strong> Pasien selalu diidentifikasi dengan NIK dan MRN di seluruh modul.</li>
            <li><strong>Global Audit Trail:</strong> Setiap aksi klinis (CREATE, UPDATE, DELETE, VIEW) dilacak secara permanen dengan tingkat keamanan Enterprise.</li>
            <li><strong>Role-Based Access Control (RBAC):</strong> Akses data klinis sangat dibatasi berdasarkan profesi (Dokter, Perawat, Farmasi, Admin) guna mencegah pelanggaran privasi.</li>
            <li><strong>High-Contrast Dark Mode:</strong> Menggunakan palet yang dirancang khusus untuk mengurangi kelelahan mata (eye fatigue) pada shift malam.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'patient',
    title: 'Direktori & Admisi Pasien',
    icon: 'groups',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-primary mb-2">Manajemen Pasien</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">Modul Direktori Pasien digunakan untuk pendaftaran, pencarian, dan pembuatan kunjungan (Encounter) baru.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-surface-container-low border border-outline-variant p-4">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined">person_add</span>
              <h4 className="font-bold text-sm">Pendaftaran Pasien Baru</h4>
            </div>
            <p className="text-xs text-outline leading-relaxed">Pendaftaran pasien mengharuskan kelengkapan data demografis yang ketat. NIK akan digunakan sebagai identitas unik berstandar nasional, dan MRN akan di-*generate* secara otomatis.</p>
          </div>
          <div className="card bg-surface-container-low border border-outline-variant p-4">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined">login</span>
              <h4 className="font-bold text-sm">Proses Admisi (Encounter)</h4>
            </div>
            <p className="text-xs text-outline leading-relaxed">Untuk setiap kunjungan, staf wajib membuat *Encounter* baru dan mengisi Keluhan Utama (Chief Complaint). Ini menghubungkan pasien dengan Modul Triage dan EMR.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'triage',
    title: 'Modul Triase & IGD',
    icon: 'emergency',
    content: <div className="card bg-surface-container-lowest border border-outline-variant p-6 shadow-sm"><MarkdownViewer content={emergencyTriageMd} /></div>
  },
  {
    id: 'emr',
    title: 'Rekam Medis (EMR)',
    icon: 'medical_information',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-primary mb-2">Rekam Medis Elektronik Terintegrasi</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">EMR merupakan pusat dokumentasi klinis pasien. Dirancang agar Dokter dan Perawat dapat berkolaborasi dalam satu layar terpusat tanpa harus berpindah-pindah tab.</p>
        </div>
        
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <li className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined">history_edu</span>
            </div>
            <div>
              <p className="font-bold text-sm mb-1">SOAP Notes</p>
              <p className="text-xs text-outline leading-relaxed">Dokumentasi Subjective, Objective, Assessment, dan Plan terstruktur. Data Objective akan ditarik secara otomatis dari modul Triage/Vital Signs.</p>
            </div>
          </li>
          <li className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined">prescriptions</span>
            </div>
            <div>
              <p className="font-bold text-sm mb-1">CPOE (Peresepan)</p>
              <p className="text-xs text-outline leading-relaxed">Computerized Physician Order Entry. Peresepan obat elektronik yang langsung terhubung ke modul Farmasi dan Billing.</p>
            </div>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 'admin',
    title: 'Admin Hub & Master Data',
    icon: 'admin_panel_settings',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-primary mb-2">Pusat Komando Administrasi</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">Hanya dapat diakses oleh pengguna dengan role Administrator. Berfungsi mengatur metrik kesehatan sistem, mengontrol pengguna, dan mengelola Master Data rumah sakit secara terpusat.</p>
        </div>
        
        <div className="p-5 border border-error-outline bg-error-container/10 rounded-2xl">
          <h4 className="font-bold text-error mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span> Peringatan Audit Ketat
          </h4>
          <p className="text-sm text-on-surface leading-relaxed">
            Semua aktivitas di dalam area Admin, termasuk perubahan pada Master Data (Obat, Tindakan, Pengguna), atau pemantauan rekam medis akan dicatat permanen dalam <strong>Global Audit Trail</strong>. 
            Data ini tidak dapat dihapus (immutable) dan dapat diekspor langsung sebagai bukti kepatuhan operasional untuk surveyor JCI.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'scenarios',
    title: 'Skenario Alur Nyata',
    icon: 'route',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-primary mb-2">Simulasi Alur Kasus Nyata</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">Berikut adalah dokumentasi skenario klinis nyata yang mensimulasikan penggunaan end-to-end sistem NurseFlow.</p>
        </div>

        <div className="space-y-6">
          <div className="card bg-surface-container-lowest border border-outline-variant p-6 shadow-sm hover:shadow-md transition-shadow">
            <MarkdownViewer content={scenarioIgdMd} />
          </div>
          
          <div className="card bg-surface-container-lowest border border-outline-variant p-6 shadow-sm hover:shadow-md transition-shadow mt-6">
            <MarkdownViewer content={scenarioPoliMd} />
          </div>
        </div>
      </div>
    )
  }
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState(GUIDE_SECTIONS[0].id);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-3xl">menu_book</span>
          </div>
          <div>
            <h1 className="text-3xl font-headline font-black text-on-surface tracking-tight">NurseFlow Guide</h1>
            <p className="text-sm font-medium text-on-surface-variant mt-1">Buku Panduan Digital Sistem Informasi Klinis (JCI Compliant)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 md:gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="w-full">
          <div className="card p-0 overflow-hidden lg:sticky lg:top-8 border border-outline-variant/50 shadow-sm">
            <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant">
              <h2 className="font-black text-[10px] uppercase tracking-widest text-outline">Daftar Isi Panduan</h2>
            </div>
            <ul className="p-3 space-y-1">
              {GUIDE_SECTIONS.map(section => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all text-left group ${
                      activeTab === section.id
                        ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-primary font-medium'
                    }`}
                  >
                    <span className={`material-symbols-outlined transition-transform ${activeTab === section.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {section.icon}
                    </span>
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Content Area */}
        <main className="w-full">
          <div className="card bg-surface-container-lowest min-h-[600px] p-6 md:p-8 border border-outline-variant/50 shadow-sm">
            {GUIDE_SECTIONS.find(s => s.id === activeTab)?.content}
          </div>
        </main>
      </div>
    </div>
  );
}

