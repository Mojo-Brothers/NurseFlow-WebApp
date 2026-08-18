/**
 * NurseFlow Enterprise HIS 2026 — Multi-Drug Interaction Cluster Repository
 * Standards: Polopharmacy Cascade Detection & Class-Class Interactions
 */

import { MultiDrugInteractionCluster } from '../modules/cdss/entities/ClinicalSafetyEntities.js';

class MultiDrugInteractionClusterRepository {
  constructor() {
    this.clusters = new Map();
    this.initCanonicalClusters();
  }

  initCanonicalClusters() {
    const defaultClusters = [
      new MultiDrugInteractionCluster({
        id: 'CLUS-001',
        clusterCode: 'TRIPLE_ANTITHROMBOTIC_HAZARD',
        clusterName: 'Kombinasi Polifarmasi Antikoagulan & Ganda Antiplatelet (Triple Bleeding Risk)',
        participatingClasses: ['ANTICOAGULANT', 'ANTIPLATELET', 'NSAID'],
        minMatchingDrugs: 3,
        severity: 'FATAL_HARD_STOP',
        clinicalSynergyMechanism: 'Blokade total hemostasis sekunder + agregasi trombosit primer + erosi mukosa gaster.',
        clinicalRiskEffect: 'Peningkatan risiko perdarahan fatal saluran cerna dan intrakranial hingga 12x lipat.',
        mandatoryAction: 'Hentikan NSAID / agen antiplatelet kedua dan berikan PPI dosis ganda.'
      }),
      new MultiDrugInteractionCluster({
        id: 'CLUS-002',
        clusterCode: 'SYNERGISTIC_NEPHROTOXICITY_HAZARD',
        clusterName: 'Sinergisme Kerusakan Tubulus Ginjal (Triple Whammy AKI)',
        participatingClasses: ['ACE_INHIBITOR', 'DIURETIC', 'NSAID'],
        minMatchingDrugs: 3,
        severity: 'CRITICAL_HIGH',
        clinicalSynergyMechanism: 'Penurunan perfusi arteriol aferen + dilatasi eferen + hipovolemia memicu nekrosis tubular akut (ATN).',
        clinicalRiskEffect: 'Risiko gagal ginjal akut mendadak (AKI Stadium 3) memerlukan dialisis darurat.',
        mandatoryAction: 'Hindari kombinasi NSAID pada pasien dengan ACE-i dan Loop Diuretic.'
      })
    ];

    defaultClusters.forEach(c => this.clusters.set(c.id, c));
  }

  async findMatchingClusters(drugClassesPresent = []) {
    const matches = [];
    const classSet = new Set(drugClassesPresent);

    for (const cluster of this.clusters.values()) {
      if (!cluster.isActive) continue;

      const matchingCount = cluster.participatingClasses.filter(cls => classSet.has(cls)).length;
      if (matchingCount >= cluster.minMatchingDrugs) {
        matches.push({
          cluster,
          matchedClasses: cluster.participatingClasses.filter(cls => classSet.has(cls)),
          matchingCount
        });
      }
    }

    return matches;
  }
}

export const multiDrugInteractionClusterRepository = new MultiDrugInteractionClusterRepository();
