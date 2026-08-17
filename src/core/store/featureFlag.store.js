import { create } from 'zustand';

export const useFeatureFlagStore = create((set, get) => ({
  flags: {
    ENABLE_SATUSEHAT_SYNC: true,
    ENABLE_BPJS_VCLAIM_BRIDGING: true,
    ENABLE_LOINC_STANDARDIZATION: true,
    ENABLE_DICOM_PACS_VIEWER: true,
    ENABLE_VOICE_SYNTH_QUEUE: true,
    ENABLE_STRICT_JCI_ALLERGY_BLOCK: true,
    ENABLE_HIGH_ALERT_DOUBLE_CHECK: true
  },

  setFlag: (flagName, value) => {
    set(state => ({
      flags: { ...state.flags, [flagName]: value }
    }));
  },

  isFeatureEnabled: (flagName) => {
    return !!get().flags[flagName];
  }
}));
