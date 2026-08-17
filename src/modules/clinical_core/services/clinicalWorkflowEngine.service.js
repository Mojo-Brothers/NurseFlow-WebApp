/**
 * NurseFlow Enterprise HIS 2026 — Reusable Clinical Workflow Engine
 * Core Clinical Backbone: Declarative multi-step clinical pipelines for
 * Emergency (IGD), Ambulatory (Poli), and Inpatient (Rawat Inap).
 * Standar Kepatuhan: JCI 7th Edition (Standardized Clinical Care Pathways).
 */

export const WORKFLOW_TEMPLATES = {
  IGD_EMERGENCY_PATHWAY: {
    code: 'IGD_EMERGENCY_PATHWAY',
    name: 'Alur Pelayanan Gawat Darurat (IGD)',
    steps: [
      { step: 'PLANNED', label: 'Kedatangan Pasien / Pra-Hospital', role: 'SECURITY_ADM' },
      { step: 'TRIAGED', label: 'Penilaian Skala Triase ATS (P1-P5)', role: 'NURSE_TRIAGE' },
      { step: 'RESUSCITATION', label: 'Penanganan Akut & Stabilisasi', role: 'DPJP_EMERGENCY' },
      { step: 'OBSERVATION', label: 'Observasi TTV & Evaluasi Terapi', role: 'NURSE_ICU_IGD' },
      { step: 'ADMISSION', label: 'Keputusan Rawat Inap / Pulang / Rujuk', role: 'DPJP_MAIN' }
    ]
  },
  OUTPATIENT_POLI_PATHWAY: {
    code: 'OUTPATIENT_POLI_PATHWAY',
    name: 'Alur Pelayanan Poliklinik Rawat Jalan',
    steps: [
      { step: 'PLANNED', label: 'Registrasi & Pengambilan Antrean', role: 'FRONT_OFFICE' },
      { step: 'CHECK_IN', label: 'Anamnesa Awal & Tanda Vital Perawat', role: 'NURSE_POLI' },
      { step: 'CONSULTATION', label: 'Pemeriksaan Klinis DPJP & E-Resep', role: 'DOCTOR_DPJP' },
      { step: 'COMPLETED', label: 'Pengambilan Obat & Billing Kasir', role: 'PHARMACY_CASHIER' }
    ]
  },
  INPATIENT_WARD_PATHWAY: {
    code: 'INPATIENT_WARD_PATHWAY',
    name: 'Alur Pelayanan Rawat Inap Bangsal',
    steps: [
      { step: 'ADMISSION', label: 'Admisi & Verifikasi Penjamin', role: 'ADMISSION_OFFICER' },
      { step: 'BED_ASSIGNED', label: 'Alokasi Tempat Tidur & Handover SBAR', role: 'NURSE_HEAD' },
      { step: 'TREATMENT', label: 'Asuhan Medis, eMAR & Visite DPJP', role: 'CLINICAL_TEAM' },
      { step: 'DISCHARGE', label: 'Discharge Planning & Ringkasan Pulang', role: 'DPJP_MAIN' }
    ]
  }
};

const WORKFLOW_INSTANCES_KEY = 'nurseflow_clinical_workflow_instances';

const getStoredWorkflows = () => {
  try {
    const raw = localStorage.getItem(WORKFLOW_INSTANCES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[ClinicalWorkflowEngine] Failed to load workflow instances:', e);
  }
  return [];
};

const saveStoredWorkflows = (instances) => {
  try {
    localStorage.setItem(WORKFLOW_INSTANCES_KEY, JSON.stringify(instances));
  } catch (e) {
    console.warn('[ClinicalWorkflowEngine] Failed to save workflow instances:', e);
  }
};

export const clinicalWorkflowEngineService = {
  /**
   * Start a new workflow instance for an encounter
   */
  startWorkflow: async ({
    encounterId,
    episodeId,
    patientName,
    templateCode = 'OUTPATIENT_POLI_PATHWAY',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const template = WORKFLOW_TEMPLATES[templateCode];
    if (!template) {
      throw new Error(`Template alur klinis tidak ditemukan: ${templateCode}`);
    }

    const now = new Date().toISOString();
    const instance = {
      id: `WFI-${Date.now()}`,
      encounter_id: encounterId,
      episode_id: episodeId,
      patient_name: patientName,
      template_code: templateCode,
      template_name: template.name,
      current_step: template.steps[0].step,
      current_step_index: 0,
      total_steps: template.steps.length,
      history: [
        {
          step: template.steps[0].step,
          label: template.steps[0].label,
          started_at: now,
          completed_at: null,
          actor: actorEmail
        }
      ],
      is_completed: false,
      created_at: now
    };

    const currentList = getStoredWorkflows();
    saveStoredWorkflows([instance, ...currentList]);

    return instance;
  },

  /**
   * Advance workflow to the next step
   */
  advanceStep: async ({
    instanceId,
    notes = '',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const list = getStoredWorkflows();
    const index = list.findIndex(w => w.id === instanceId);

    if (index === -1) {
      throw new Error(`Instance workflow ${instanceId} tidak ditemukan.`);
    }

    const instance = list[index];
    const template = WORKFLOW_TEMPLATES[instance.template_code];
    const nextIndex = instance.current_step_index + 1;

    if (nextIndex >= template.steps.length) {
      // Completed
      instance.is_completed = true;
      instance.history[instance.current_step_index].completed_at = new Date().toISOString();
      instance.history[instance.current_step_index].notes = notes;
    } else {
      const now = new Date().toISOString();
      instance.history[instance.current_step_index].completed_at = now;
      instance.history[instance.current_step_index].notes = notes;

      const nextStep = template.steps[nextIndex];
      instance.current_step = nextStep.step;
      instance.current_step_index = nextIndex;
      instance.history.push({
        step: nextStep.step,
        label: nextStep.label,
        started_at: now,
        completed_at: null,
        actor: actorEmail
      });
    }

    list[index] = instance;
    saveStoredWorkflows(list);

    return instance;
  },

  /**
   * Get all active workflow instances
   */
  getActiveWorkflows: () => {
    return getStoredWorkflows();
  },

  /**
   * Get available workflow templates
   */
  getTemplates: () => {
    return Object.values(WORKFLOW_TEMPLATES);
  }
};
