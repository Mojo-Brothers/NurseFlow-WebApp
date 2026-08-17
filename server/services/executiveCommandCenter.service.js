/**
 * NurseFlow Enterprise HIS 2026 — Executive Central Command Center Engine
 * Standards: Permenkes Juknis SIRS, JCI Governance & Leadership (GLD/QPS), ISO 27001
 * Domains: Capacity Command, Emergency SLA, Financial Cycle, Clinical Safety, Blood Bank & Executive Rules Engine
 */

export const executiveCommandCenterService = {
  /**
   * 1. GET CAPACITY COMMAND METRICS
   */
  getCapacityMetrics: () => {
    const totalBeds = 120;
    const occupiedBeds = 94;
    const icuTotal = 18;
    const icuOccupied = 14;
    const isolationTotal = 6;
    const isolationOccupied = 4;

    const bor = parseFloat(((occupiedBeds / totalBeds) * 100).toFixed(1)); // 78.3%
    const icuBor = parseFloat(((icuOccupied / icuTotal) * 100).toFixed(1)); // 77.8%
    const isoBor = parseFloat(((isolationOccupied / isolationTotal) * 100).toFixed(1)); // 66.7%

    return {
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      bor,
      borStatus: bor > 85 ? 'CRITICAL' : bor >= 60 ? 'OPTIMAL' : 'WARNING',
      alos: 4.3,
      alosStatus: 'OPTIMAL', // 3 - 6 days
      toi: 1.8,
      toiStatus: 'OPTIMAL', // 1 - 3 days
      bto: 46.2,
      btoStatus: 'OPTIMAL',
      icu: {
        total: icuTotal,
        occupied: icuOccupied,
        available: icuTotal - icuOccupied,
        bor: icuBor,
        status: icuBor > 90 ? 'CRITICAL' : icuBor >= 70 ? 'OPTIMAL' : 'WARNING'
      },
      isolation: {
        total: isolationTotal,
        occupied: isolationOccupied,
        available: isolationTotal - isolationOccupied,
        bor: isoBor,
        status: isoBor > 85 ? 'CRITICAL' : 'OPTIMAL'
      },
      todayAdmissions: 28,
      todayDischarges: 19,
      transferPending: 3
    };
  },

  /**
   * 2. GET EMERGENCY DEPARTMENT COMMAND METRICS
   */
  getEmergencyMetrics: () => {
    const avgWaitingTimeMinutes = 18;
    const doorToDoctorMinutes = 11;
    const doorToAdmissionMinutes = 94;

    return {
      activePatients: 34,
      avgWaitingTimeMinutes,
      waitingTimeStatus: avgWaitingTimeMinutes > 60 ? 'WARNING' : 'OPTIMAL',
      longestWaitingTimeMinutes: 42,
      doorToDoctorMinutes,
      doorToDoctorStatus: doorToDoctorMinutes > 30 ? 'WARNING' : 'OPTIMAL',
      doorToAdmissionMinutes,
      leftWithoutBeingSeenRate: 0.8, // 0.8%
      lwbsStatus: 'OPTIMAL', // < 2% standard
      patientsBoardingOver6Hours: 2,
      triageDistribution: {
        P1_RESUSCITATION: 4,
        P2_EMERGENT: 12,
        P3_URGENT: 28,
        P4_SEMI_URGENT: 15,
        P5_NON_URGENT: 6
      },
      ambulanceIncoming: 2
    };
  },

  /**
   * 3. GET FINANCIAL & REVENUE CYCLE COMMAND METRICS
   */
  getFinancialMetrics: () => {
    const todayRevenue = 487000000;
    const monthlyRevenue = 8420000000;
    const bpjsClaimsApproved = 312000000;
    const pendingClaims = 78000000;
    const totalClaimsSubmitted = 390000000;
    const rejectedClaimsAmount = 7000000; // 1.8%
    const rejectionRate = parseFloat(((rejectedClaimsAmount / totalClaimsSubmitted) * 100).toFixed(1));

    return {
      todayRevenue,
      monthlyRevenue,
      bpjsClaimsApproved,
      pendingClaims,
      rejectedClaimsAmount,
      rejectionRate,
      rejectionStatus: rejectionRate > 5.0 ? 'CRITICAL' : rejectionRate > 3.0 ? 'WARNING' : 'OPTIMAL',
      avgClaimProcessingDays: 3.2,
      cashFlowProjectionDays: 45,
      inaCbgGroupingEfficiency: 96.4,
      topRevenueCenters: [
        { name: 'Kamar Bedah Sentral (IBS)', revenue: 165000000, share: '33.9%' },
        { name: 'Rawat Inap Paviliun & ICU', revenue: 142000000, share: '29.2%' },
        { name: 'Instalasi Farmasi Sentral', revenue: 98000000, share: '20.1%' },
        { name: 'Laboratorium & Radiologi', revenue: 82000000, share: '16.8%' }
      ]
    };
  },

  /**
   * 4. GET CLINICAL SAFETY & QUALITY INDICATORS
   */
  getClinicalSafetyMetrics: () => {
    return {
      highAlertMedicationIncidents: 0,
      criticalLabPanicEscalations: 6,
      criticalLabResponseSla100Pct: true,
      transfusionAdverseReactions: 0,
      postoperativeComplicationRate: 0.4, // < 1.0% standard
      medicationErrorReports: 0,
      hospitalAcquiredInfectionRate: 0.12, // HAI < 0.5% standard
      readmissionRate30Days: 2.1, // < 3.0% standard
      jciPatientSafetyScore: 98.8
    };
  },

  /**
   * 5. GET BLOOD BANK (BDRS) COMMAND METRICS
   */
  getBloodBankMetrics: () => {
    const prcStock = 42;
    const ffpStock = 18;
    const tcStock = 14;
    const wbStock = 8;
    const totalUnits = prcStock + ffpStock + tcStock + wbStock;

    return {
      totalUnits,
      stockStatus: totalUnits < 20 ? 'CRITICAL' : totalUnits < 40 ? 'WARNING' : 'OPTIMAL',
      components: {
        PRC: { units: prcStock, status: prcStock < 15 ? 'WARNING' : 'OPTIMAL' },
        FFP: { units: ffpStock, status: ffpStock < 10 ? 'WARNING' : 'OPTIMAL' },
        THROMBOCYTE: { units: tcStock, status: tcStock < 10 ? 'WARNING' : 'OPTIMAL' },
        WHOLE_BLOOD: { units: wbStock, status: wbStock < 5 ? 'WARNING' : 'OPTIMAL' }
      },
      nearExpirationUnits48h: 2,
      pendingEmergencyCrossmatches: 1,
      coldChainTempAlerts: 0
    };
  },

  /**
   * 6. GET EXECUTIVE KPI METRICS
   */
  getExecutiveKpis: () => {
    return {
      ndr: 12.4, // Net Death Rate < 25 per 1000 standard
      ndrStatus: 'OPTIMAL',
      gdr: 28.1, // Gross Death Rate < 45 per 1000 standard
      gdrStatus: 'OPTIMAL',
      patientSatisfactionScore: 94.8, // 94.8%
      nurseToPatientRatioGeneral: '1:4',
      nurseToPatientRatioIcu: '1:1',
      satusehatSyncRate: 99.4,
      eRmeAdoptionRate: 100.0
    };
  },

  /**
   * 7. EXECUTIVE ALERT & HEURISTIC DECISION ENGINE
   */
  evaluateExecutiveAlerts: () => {
    const cap = executiveCommandCenterService.getCapacityMetrics();
    const ed = executiveCommandCenterService.getEmergencyMetrics();
    const fin = executiveCommandCenterService.getFinancialMetrics();
    const bld = executiveCommandCenterService.getBloodBankMetrics();

    const alerts = [];

    // Capacity Rules
    if (cap.bor > 85) {
      alerts.push({
        id: 'ALERT-EXEC-01',
        category: 'CAPACITY',
        level: 'CRITICAL',
        title: 'Tingkat Hunian Tempat Tidur Kritis (BOR > 85%)',
        message: `BOR Rawat Inap saat ini ${cap.bor}%. Disarankan aktivasi protokol pelepasan bed cepat (Rapid Discharge Workflow) dan penataan kuota rawat jalan.`,
        actionLabel: 'Buka Alokasi Bed Cadangan',
        timestamp: new Date().toISOString()
      });
    }

    if (cap.icu.bor > 90) {
      alerts.push({
        id: 'ALERT-EXEC-02',
        category: 'CAPACITY',
        level: 'CRITICAL',
        title: 'Kapasitas ICU Mencapai Batas Kritis (> 90%)',
        message: `Kapasitas ICU terisi ${cap.icu.occupied}/${cap.icu.total} bed (${cap.icu.bor}%). Segera evaluasi rencana ekstubasi/stepdown ke HCU.`,
        actionLabel: 'Review Stepdown HCU',
        timestamp: new Date().toISOString()
      });
    }

    // Emergency Rules
    if (ed.avgWaitingTimeMinutes > 60) {
      alerts.push({
        id: 'ALERT-EXEC-03',
        category: 'EMERGENCY',
        level: 'WARNING',
        title: 'Waktu Tunggu Triase IGD Melebihi Standar (> 60 Menit)',
        message: `Rata-rata waktu tunggu IGD saat ini ${ed.avgWaitingTimeMinutes} menit. Disarankan pengerahan dokter jaga on-call.`,
        actionLabel: 'Mobilisasi Dokter On-Call',
        timestamp: new Date().toISOString()
      });
    }

    // Blood Bank Rules
    if (bld.totalUnits < 40) {
      alerts.push({
        id: 'ALERT-EXEC-04',
        category: 'BLOOD_BANK',
        level: 'WARNING',
        title: 'Stok Kantong Darah BDRS Rendah (< 40 Unit)',
        message: `Total persediaan darah BDRS tersisa ${bld.totalUnits} unit. Segera kirim permintaan pasokan darurat ke PMI Kota.`,
        actionLabel: 'Order Pasokan PMI',
        timestamp: new Date().toISOString()
      });
    }

    // Financial Rules
    if (fin.rejectionRate > 5.0) {
      alerts.push({
        id: 'ALERT-EXEC-05',
        category: 'FINANCIAL',
        level: 'CRITICAL',
        title: 'Rasio Penolakan Klaim BPJS Melebihi Ambang Batas (> 5%)',
        message: `Tingkat penolakan klaim mencapai ${fin.rejectionRate}%. Evaluasi kelengkapan berkas koder dan resume medis.`,
        actionLabel: 'Audit Casemix Koding',
        timestamp: new Date().toISOString()
      });
    }

    // Default Operational Assurance Notice if zero critical alerts
    if (alerts.length === 0) {
      alerts.push({
        id: 'ALERT-EXEC-00',
        category: 'GOVERNANCE',
        level: 'INFO',
        title: 'Seluruh Indikator Kinerja RS Berada Dalam Batas Normal',
        message: 'Seluruh 6 domain operasional (Kapasitas, IGD, Keuangan, Mutu, BDRS, dan KPI) berjalan optimal sesuai standar akreditasi JCI 7th Edition.',
        actionLabel: 'Lihat Ringkasan KPI',
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  }
};
