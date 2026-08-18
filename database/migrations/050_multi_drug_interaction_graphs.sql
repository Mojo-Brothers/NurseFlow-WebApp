-- ============================================================================
-- Migration 050: Multi-Drug Interaction Graph & Pharmacological Class Interaction
-- Standards: JCI IPSG 3, Multi-Drug Synergy & Antagonism Matrix
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_drug_interaction_clusters (
    id VARCHAR(36) PRIMARY KEY,
    cluster_code VARCHAR(50) NOT NULL UNIQUE,
    cluster_name VARCHAR(150) NOT NULL,
    participating_classes_json TEXT NOT NULL, -- e.g. ["ANTICOAGULANT", "ANTIPLATELET", "NSAID"]
    min_matching_drugs INT NOT NULL DEFAULT 2,
    severity VARCHAR(20) NOT NULL CHECK (
        severity IN ('FATAL_HARD_STOP', 'CRITICAL_HIGH', 'MODERATE', 'MINOR')
    ),
    clinical_synergy_mechanism TEXT NOT NULL,
    clinical_risk_effect TEXT NOT NULL,
    mandatory_action TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at BIGINT NOT NULL
);

-- Seed Triple Antithrombotic Therapy Risk Cluster (Warfarin + Aspirin + Clopidogrel / NSAID)
INSERT INTO multi_drug_interaction_clusters (
    id, cluster_code, cluster_name, participating_classes_json, min_matching_drugs,
    severity, clinical_synergy_mechanism, clinical_risk_effect, mandatory_action, is_active, created_at
) VALUES (
    'CLUS-DDI-001', 'TRIPLE_ANTITHROMBOTIC_HAZARD', 'Kombinasi Polifarmasi Antikoagulan & Ganda Antiplatelet (Triple Whammy Bleeding)',
    '["ANTICOAGULANT", "ANTIPLATELET", "NSAID"]', 3,
    'FATAL_HARD_STOP',
    'Blokade total kaskade pembekuan darah simultan via hemostasis sekunder (Warfarin) + agregasi trombosit primer (Aspirin/Clopidogrel) + erosi mukosa gaster (NSAID).',
    'Risiko fatal hemoragi intrakranial dan perdarahan masif gastrointestinal meningkat >12x lipat.',
    'Wajib telaah ulang indikasi PCI/STEMI, hentikan NSAID atau salah satu agen antiplatelet, dan tambahkan profilaksis PPI dosis ganda.',
    TRUE, 1723900000000
) ON CONFLICT (cluster_code) DO NOTHING;
