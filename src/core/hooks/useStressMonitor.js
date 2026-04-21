import { create } from 'zustand';

/**
 * useStressMonitor - Cognitive State Management
 * 
 * Manages global UI states for medical stress, focusing, and classic UI rollbacks.
 */
export const useStressMonitor = create((set) => ({
  stressLevel: 'none', // 'none' | 'warning' | 'critical'
  focusMode: false,
  classicUI: false,
  isPeeking: false,
  
  // Adaptive Triggers
  setStressLevel: (level) => set({ stressLevel: level }),
  setFocusMode: (active) => set({ focusMode: active }),
  setIsPeeking: (active) => set({ isPeeking: active }),
  toggleClassicUI: () => set((state) => ({ classicUI: !state.classicUI })),
  
  // Simulation Utility
  triggerCrisis: (level) => {
    if (level === 'critical') {
      set({ stressLevel: 'critical', focusMode: true });
    } else if (level === 'warning') {
      set({ stressLevel: 'warning', focusMode: false });
    } else {
      set({ stressLevel: 'none', focusMode: false });
    }
  },
  
  // Logic enforcement
  evaluateSLA: (waitingCount, slaLimit) => {
    if (waitingCount > slaLimit) {
      set({ stressLevel: 'warning' });
    } else {
      set({ stressLevel: 'none' });
    }
  },
  
  clearAlerts: () => set({ stressLevel: 'none', focusMode: false }),
}));
