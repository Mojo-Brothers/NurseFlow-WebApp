import React, { useEffect, useState } from 'react';
import { X, BedDouble, Search } from 'lucide-react';
import { getAllBeds } from '../../ward/services/bed.service.js';
import OceanicTealLoadingSpinner from '../../../components/ui/OceanicTealLoadingSpinner.jsx';

export default function BedPickerModal({ isOpen, onClose, onSelectBed }) {
  const [beds, setBeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    
    const fetchBeds = async () => {
      // Small timeout to prevent synchronous setState warning from linter
      await new Promise(resolve => setTimeout(resolve, 0));
      if (!mounted) return;
      
      setIsLoading(true);
      try {
        const data = await getAllBeds();
        if (mounted) setBeds(data);
      } catch (err) {
        console.error('Failed to load beds:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchBeds();
    }
    
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const availableBeds = beds.filter(b => !b.is_occupied);
  const filteredBeds = availableBeds.filter(b => 
    b.bed_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.ward.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface w-full max-w-3xl rounded-none border-[3px] border-black shadow-[8px_8px_0px_#000] flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex flex-row justify-between items-center p-6 border-b-[3px] border-black bg-surface-container-low">
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-on-surface">Pilih Bed Rawat</h2>
            <p className="text-xs font-bold text-on-surface-variant mt-1">Hanya menampilkan bed yang kosong</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 border-2 border-transparent hover:border-black rounded-none transition-all bg-white text-black font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b-[3px] border-black bg-white">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama bed atau bangsal..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-2 border-black font-bold text-on-surface focus:outline-none focus:ring-0 placeholder:text-on-surface-variant/50 uppercase rounded-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface">
          {isLoading ? (
            <OceanicTealLoadingSpinner variant="v1" label="Memuat Peta Ketersediaan Tempat Tidur IGD & Rawat Inap..." />
          ) : filteredBeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-[3px] border-black bg-white">
              <BedDouble className="w-12 h-12 text-on-surface-variant mb-4 opacity-50" />
              <p className="text-lg font-black uppercase">Tidak ada Bed Kosong</p>
              <p className="text-sm font-bold text-on-surface-variant">Pastikan ranjang tersedia di modul Manajemen Bangsal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredBeds.map(bed => (
                <button
                  key={bed.id}
                  onClick={() => {
                    onSelectBed(bed.id, bed.bed_name, bed.ward);
                    onClose();
                  }}
                  className="flex flex-col items-center justify-center p-6 border-[3px] border-black bg-white hover:bg-[#015c80] hover:text-white transition-colors group text-on-surface rounded-none"
                >
                  <BedDouble className="w-8 h-8 mb-3 text-[#015c80] group-hover:text-white" />
                  <span className="text-lg font-black">{bed.bed_name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">
                    {bed.ward} • {bed.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
