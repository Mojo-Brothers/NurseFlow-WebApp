/**
 * NurseFlow Enterprise HIS 2026 — Tariff Versioning & Dynamic Pricing Engine
 * Computes historical pricing based on service delivery date and applies dynamic pricing adjustments.
 */

export const tariffVersioningService = {
  /**
   * Resolve effective tariff version by service date
   */
  getEffectiveTariff: (tariffId, serviceDate = new Date(), versions = []) => {
    const targetTime = new Date(serviceDate).getTime();
    const tariffVersions = versions.filter(v => v.tariff_id === tariffId);

    if (tariffVersions.length === 0) return null;

    const matched = tariffVersions.find(v => {
      const from = new Date(v.effective_from).getTime();
      const to = v.effective_to ? new Date(v.effective_to).getTime() : Infinity;
      return targetTime >= from && targetTime <= to;
    });

    return matched || tariffVersions[0];
  },

  /**
   * Calculate adjusted tariff with Cito, Holiday, or Special Rules
   */
  calculateDynamicTariff: ({
    baseAmount = 0,
    isCito = false,
    citoPercentage = 25,
    isHoliday = false,
    holidayPercentage = 20,
    isGuestDoctor = false,
    guestDoctorSurcharge = 50000
  }) => {
    let finalAmount = Number(baseAmount);
    const adjustments = [];

    if (isCito && citoPercentage > 0) {
      const citoAdd = (finalAmount * citoPercentage) / 100;
      finalAmount += citoAdd;
      adjustments.push({ type: 'CITO_EMERGENCY', percentage: citoPercentage, amount: citoAdd });
    }

    if (isHoliday && holidayPercentage > 0) {
      const holidayAdd = (finalAmount * holidayPercentage) / 100;
      finalAmount += holidayAdd;
      adjustments.push({ type: 'HOLIDAY_OVERTIME', percentage: holidayPercentage, amount: holidayAdd });
    }

    if (isGuestDoctor && guestDoctorSurcharge > 0) {
      finalAmount += guestDoctorSurcharge;
      adjustments.push({ type: 'GUEST_DOCTOR_SURCHARGE', amount: guestDoctorSurcharge });
    }

    return {
      baseAmount: Number(baseAmount),
      finalAmount: Math.round(finalAmount),
      adjustments
    };
  }
};
