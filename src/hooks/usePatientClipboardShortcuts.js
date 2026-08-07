import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { usePatientStore } from '../modules/patient/patient.store.js';
import { DEMO_PATIENTS } from '../core/demoData.js';

/**
 * Custom Hook: usePatientClipboardShortcuts
 * Fungsionalitas Keyboard Shortcut Global Enterprise HIS 2026:
 * - Ctrl + C (atau Cmd + C): Menyalin No. RM (MRN) pasien aktif ke clipboard saat tidak sedang mengetik teks.
 * - Ctrl + V (atau Cmd + V): Menempelkan No. RM dari clipboard langsung ke kolom pencarian pasien & membuka dropdown hasil instan.
 */
export function usePatientClipboardShortcuts({ onPasteMrn } = {}) {
  const { selectedPatientId, patients } = usePatientStore();

  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Abaikan jika sedang mengetik di input, textarea, atau contentEditable
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable
      );

      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // ─── 1. CTRL + C: Salin No. RM Pasien Aktif ───
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        const selectedText = window.getSelection()?.toString();
        // Hanya picu salin otomatis jika user tidak sedang memblokir/menyalin teks tertentu
        if (!isInput && !selectedText) {
          const list = (patients && patients.length > 0) ? patients : DEMO_PATIENTS;
          const activePatient = list.find(p => p.id === selectedPatientId) || list[0];
          const mrn = activePatient?.mrn || '100001';

          if (mrn) {
            e.preventDefault();
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(mrn);
              } else {
                const textArea = document.createElement("textarea");
                textArea.value = mrn;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
              }
              toast.dismiss('copy-toast');
              toast.success(`[Ctrl+C] No. RM (${mrn}) disalin ke clipboard!`, { id: 'copy-toast', icon: '📋' });
            } catch (err) {
              console.warn('[Shortcut] Failed to copy MRN:', err);
            }
          }
        }
      }

      // ─── 2. CTRL + V: Tempel No. RM ke Pencarian Pasien ───
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        // Jika sedang aktif mengetik di input, biarkan input menangani paste secara native/internal
        if (isInput) return;

        e.preventDefault();
        try {
          let pastedText = '';
          if (navigator.clipboard && navigator.clipboard.readText) {
            pastedText = await navigator.clipboard.readText();
          }
          
          if (pastedText) {
            const cleaned = pastedText.replace(/^(mrn[:\s-]*|rm[:\s-]*|no\.?\s*rm[:\s-]*|#\s*)/i, '').trim();
            if (onPasteMrn) {
              onPasteMrn(cleaned);
            }
            toast.success(`[Ctrl+V] Menempelkan No. RM (${cleaned}) di pencarian!`, { icon: '📥' });
          } else {
            toast('Gunakan Ctrl+V di dalam kolom pencarian untuk menempelkan No. RM.', { icon: '💡' });
          }
        } catch (err) {
          if (onPasteMrn) {
            onPasteMrn('');
          }
          toast('Fokus diarahkan ke pencarian. Tekan Ctrl+V untuk menempelkan No. RM.', { icon: '🔎' });
        }
      }

      // ─── 3. CTRL + A: Hanya Berlaku di Dalam Kolom/Input Teks ───
      if (isCmdOrCtrl && e.key.toLowerCase() === 'a') {
        if (isInput) {
          // Hanya seleksi isi teks di dalam kolom input/textarea yang sedang difokuskan
          if (typeof activeEl.select === 'function') {
            activeEl.select();
          }
        } else {
          // Cegah penyeleksian seluruh dokumen/halaman web
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatientId, patients, onPasteMrn]);
}

export default usePatientClipboardShortcuts;
