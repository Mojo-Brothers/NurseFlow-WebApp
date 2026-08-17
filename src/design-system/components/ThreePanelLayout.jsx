import React from 'react';

/**
 * NurseFlow Enterprise 3-Panel Layout
 * Standard: [Panel Kiri: Daftar Pasien/Worklist] | [Panel Tengah: Clinical Workspace] | [Panel Kanan: Quick Context/Alerts]
 */
export default function ThreePanelLayout({
  leftPanel,
  mainPanel,
  rightPanel,
  leftWidth = 'w-full lg:w-72 xl:w-80 shrink-0',
  rightWidth = 'w-full lg:w-72 xl:w-80 shrink-0'
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-full min-h-[calc(100vh-140px)]">
      {/* Left Panel (Patient List / Worklist) */}
      {leftPanel && (
        <aside className={`${leftWidth} flex flex-col gap-3`}>
          {leftPanel}
        </aside>
      )}

      {/* Center Main Workspace */}
      <main className="flex-1 flex flex-col gap-4 min-w-0">
        {mainPanel}
      </main>

      {/* Right Quick Panel (Alerts / Tasks / Quick Summary) */}
      {rightPanel && (
        <aside className={`${rightWidth} flex flex-col gap-3`}>
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
