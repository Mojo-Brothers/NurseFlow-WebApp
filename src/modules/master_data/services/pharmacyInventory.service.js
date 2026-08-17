/**
 * NurseFlow Enterprise HIS 2026 — Pharmacy Inventory & Unit Conversion Service
 * Multi-level unit factor conversion (Box -> Strip -> Blister -> Tablet / Vial -> Ampule -> mL)
 * and First-Expired-First-Out (FEFO) dispensing validator.
 */

export const DEFAULT_UNIT_CONVERSION_FACTORS = [
  { medicine_id: 'MED-AML-10', from_unit: 'BOX', to_unit: 'STRIP', factor: 10 },
  { medicine_id: 'MED-AML-10', from_unit: 'STRIP', to_unit: 'TABLET', factor: 10 },
  { medicine_id: 'MED-AML-10', from_unit: 'BOX', to_unit: 'TABLET', factor: 100 },
  { medicine_id: 'MED-CEF-1', from_unit: 'BOX', to_unit: 'VIAL', factor: 10 },
  { medicine_id: 'MED-MOR-10', from_unit: 'BOX', to_unit: 'AMPUL', factor: 10 }
];

export const pharmacyInventoryService = {
  /**
   * Multi-level Unit Conversion Calculator
   */
  convertInventoryUnits: (quantity, fromUnit, toUnit, conversionRules = DEFAULT_UNIT_CONVERSION_FACTORS) => {
    if (!quantity || isNaN(quantity)) return 0;
    if (!fromUnit || !toUnit || fromUnit.toUpperCase() === toUnit.toUpperCase()) {
      return Number(quantity);
    }

    const rule = conversionRules.find(r => 
      r.from_unit.toUpperCase() === fromUnit.toUpperCase() &&
      r.to_unit.toUpperCase() === toUnit.toUpperCase()
    );

    if (rule) {
      return Number(quantity) * rule.factor;
    }

    // Inverse rule
    const inverseRule = conversionRules.find(r => 
      r.from_unit.toUpperCase() === toUnit.toUpperCase() &&
      r.to_unit.toUpperCase() === fromUnit.toUpperCase()
    );

    if (inverseRule) {
      return Number(quantity) / inverseRule.factor;
    }

    return Number(quantity); // fallback
  },

  /**
   * Sort inventory batches by FEFO (Earliest Expiry First)
   */
  sortBatchesFEFO: (batches = []) => {
    return [...batches].sort((a, b) => {
      const expA = new Date(a.expiry_date || '2099-12-31').getTime();
      const expB = new Date(b.expiry_date || '2099-12-31').getTime();
      return expA - expB;
    });
  }
};
