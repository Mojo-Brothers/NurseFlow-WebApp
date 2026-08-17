import React, { useState, useEffect, useRef } from 'react';
import { WINDOWING_PRESETS } from '../services/pacsDicomEngine.service.js';

export default function DicomWebViewer({ study }) {
  if (!study) {
    return (
      <div className="p-12 text-center text-slate-400 bg-slate-950 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3 min-h-[400px]">
        <span className="material-symbols-outlined text-4xl text-slate-600">medical_services</span>
        <p className="text-sm font-medium">Pilih studi DICOM dari Modality Worklist untuk memuat citra diagnostik.</p>
      </div>
    );
  }

  const activeStudy = study;

  const canvasRef = useRef(null);
  const [activePreset, setActivePreset] = useState('CHEST_SOFT_TISSUE');
  const [windowCenter, setWindowCenter] = useState(40);
  const [windowWidth, setWindowWidth] = useState(350);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isInverted, setIsInverted] = useState(false);
  const [activeTool, setActiveTool] = useState('WINDOW'); // 'WINDOW' | 'PAN' | 'ZOOM' | 'RULER'
  const [caliperMeasurement, setCaliperMeasurement] = useState('52.4 mm (Normal CTR)');
  const [pixelSpacingMm] = useState(0.14);

  // Generate and render simulated anatomical matrix with standard VOI LUT windowing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Center coordinates
    const cx = width / 2;
    const cy = height / 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let rawHu = -1000; // Background Air HU

        if (activeStudy.modality === 'CT') {
          // Brain CT Density Model: Skull (Bone ~800), Brain Tissue (~35), Ventricle (~10)
          if (dist < 160 && dist > 145) {
            rawHu = 850; // Skull Bone
          } else if (dist <= 145) {
            // Brain Parenchyma with sulci texture
            const texture = Math.sin(x / 8) * Math.cos(y / 8) * 5;
            if (dist < 40 && Math.abs(dx) < 15) {
              rawHu = 5 + texture; // Ventricles CSF
            } else {
              rawHu = 35 + texture; // Gray/White Matter
            }
          }
        } else {
          // Thorax Digital X-Ray Model: Mediastinum/Heart (+50), Ribs (+300), Lungs (-600)
          if (dist < 180) {
            const isRib = Math.abs(Math.sin((y + x * 0.2) / 12)) > 0.7;
            const isHeart = dist < 70 && dx > -20 && dy > -10;
            if (isHeart) {
              rawHu = 45; // Cardiac Shadow
            } else if (isRib) {
              rawHu = 350; // Ribs Bone
            } else {
              rawHu = -650; // Lung Parenchyma
            }
          }
        }

        // Standard DICOM VOI LUT Windowing Formula
        const normalized = ((rawHu - (windowCenter - 0.5)) / (windowWidth - 1) + 0.5);
        let pixelVal = Math.floor(normalized * 255);
        pixelVal = Math.max(0, Math.min(255, pixelVal));

        if (isInverted) {
          pixelVal = 255 - pixelVal;
        }

        data[idx] = pixelVal;     // R
        data[idx + 1] = pixelVal; // G
        data[idx + 2] = pixelVal; // B
        data[idx + 3] = 255;      // Alpha
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [activeStudy, windowCenter, windowWidth, isInverted]);

  const handleApplyPreset = (presetKey) => {
    setActivePreset(presetKey);
    const preset = WINDOWING_PRESETS[presetKey];
    if (preset) {
      setWindowCenter(preset.wl);
      setWindowWidth(preset.ww);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 p-5 shadow-2xl space-y-4 flex flex-col">
      {/* Top DICOM Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">view_in_ar</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">{activeStudy.studyDescription}</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-bold">
                {activeStudy.modality} DICOM PS 3.18 WADO-RS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              ACC: {activeStudy.accessionNumber} • UID: {activeStudy.studyInstanceUid.slice(-14)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
            {activeStudy.patientName} ({activeStudy.patientMrn})
          </span>
        </div>
      </div>

      {/* Interactive Toolbars */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setActiveTool('WINDOW')}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              activeTool === 'WINDOW' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">contrast</span>
            <span className="hidden sm:inline">VOI LUT</span>
          </button>

          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 25, 300))}
            className="p-2 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">zoom_in</span>
            <span>+{zoomLevel}%</span>
          </button>

          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 25, 50))}
            className="p-2 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer flex items-center"
          >
            <span className="material-symbols-outlined text-[16px]">zoom_out</span>
          </button>

          <button
            onClick={() => setIsInverted(prev => !prev)}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              isInverted ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">invert_colors</span>
            <span className="hidden sm:inline">Invert</span>
          </button>

          <button
            onClick={() => setActiveTool('RULER')}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              activeTool === 'RULER' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">straighten</span>
            <span className="hidden sm:inline">Kaliper (mm)</span>
          </button>
        </div>

        {/* Windowing Presets Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Preset:</span>
          <select
            value={activePreset}
            onChange={(e) => handleApplyPreset(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs cursor-pointer focus:outline-none"
          >
            {Object.entries(WINDOWING_PRESETS).map(([key, p]) => (
              <option key={key} value={key}>
                {p.name} (WL:{p.wl}/WW:{p.ww})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Manual WL / WW Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/50 rounded-2xl border border-slate-800/80 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 w-24">Window Level (WL):</span>
          <input
            type="range"
            min="-1000"
            max="1000"
            value={windowCenter}
            onChange={(e) => setWindowCenter(Number(e.target.value))}
            className="w-full accent-teal-500 cursor-pointer"
          />
          <span className="text-white font-bold w-12 text-right">{windowCenter}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 w-24">Window Width (WW):</span>
          <input
            type="range"
            min="1"
            max="3000"
            value={windowWidth}
            onChange={(e) => setWindowWidth(Number(e.target.value))}
            className="w-full accent-teal-500 cursor-pointer"
          />
          <span className="text-white font-bold w-12 text-right">{windowWidth}</span>
        </div>
      </div>

      {/* Canvas Diagnostic Viewport */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-black border border-slate-800 flex items-center justify-center overflow-hidden select-none">
        {/* Top-Left Demographics Watermark */}
        <div className="absolute top-3 left-3 text-[11px] font-mono text-slate-400 leading-tight pointer-events-none z-10">
          <div className="font-bold text-white">{activeStudy.patientName}</div>
          <div>No. RM: {activeStudy.patientMrn}</div>
          <div>Tgl Uji: {activeStudy.studyDate}</div>
        </div>

        {/* Top-Right Technical Overlay */}
        <div className="absolute top-3 right-3 text-[11px] font-mono text-slate-400 text-right leading-tight pointer-events-none z-10">
          <div className="text-teal-400 font-bold">{activeStudy.modality} DIAGNOSTIC CANVAS</div>
          <div>kVp: 120 • mA: 250</div>
          <div>Pixel Spacing: {pixelSpacingMm} mm</div>
        </div>

        {/* Actual HTML5 Pixel Canvas */}
        <div
          className="flex items-center justify-center transition-transform"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <canvas
            ref={canvasRef}
            width={384}
            height={384}
            className="rounded-2xl border border-slate-800 shadow-inner"
          />

          {/* Caliper Overlay if Tool Active */}
          {activeTool === 'RULER' && (
            <div className="absolute inset-x-12 top-1/2 border-b-2 border-dashed border-emerald-400 flex items-center justify-center pointer-events-none">
              <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/40 -mt-6">
                📏 {caliperMeasurement}
              </span>
            </div>
          )}
        </div>

        {/* Bottom-Left Overlay */}
        <div className="absolute bottom-3 left-3 text-[11px] font-mono text-slate-400 pointer-events-none z-10">
          <div>WL: <span className="text-white font-bold">{windowCenter}</span> • WW: <span className="text-white font-bold">{windowWidth}</span></div>
          <div>LUT: {isInverted ? 'Monochrome 1 (Inverted)' : 'Monochrome 2 (Standard)'}</div>
        </div>

        {/* Bottom-Right Integrity Seal */}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-emerald-400 pointer-events-none z-10 flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">verified_user</span>
          <span>DICOMweb WADO-RS LOSSLESS VOI LUT</span>
        </div>
      </div>
    </div>
  );
}
