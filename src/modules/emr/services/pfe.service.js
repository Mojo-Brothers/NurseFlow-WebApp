/**
 * 🎓 PATIENT & FAMILY EDUCATION SERVICE (PFE - Phase 31)
 * Adheres to JCI Standards for Patient and Family Education.
 */

export const EDUCATION_TOPICS = [
  { id: 'MED_SAFETY', label: 'Safe Medication Use', category: 'Medication' },
  { id: 'WOUND_CARE', label: 'Wound Care & Hygiene', category: 'Post-Op' },
  { id: 'DIETARY', label: 'Dietary Restrictions', category: 'Nutrition' },
  { id: 'PAIN_MGMT', label: 'Pain Management Techniques', category: 'Recovery' },
  { id: 'FALL_PREV', label: 'Fall Prevention at Home', category: 'Safety' },
  { id: 'FOLLOW_UP', label: 'Follow-up Schedule & Urgency', category: 'General' }
];

/**
 * Save an education session to the patient's record
 */
export const saveEducationSession = async (sessionData) => {
  const { encounterId, patientId, topicId, userEmail, understandingLevel } = sessionData;
  
  const payload = {
    encounterId,
    patientId,
    topicId,
    educator: userEmail,
    timestamp: new Date().toISOString(),
    understandingLevel, // 'EXCELLENT' | 'GOOD' | 'NEEDS_REINFORCEMENT'
    status: 'COMPLETED'
  };

  console.log('[PFE] Education Logged:', payload);
  // In real implementation, this saves to EDUCATION_LOGS collection
  return payload;
};

/**
 * Get assigned materials for the Patient Portal
 */
export const getAssignedMaterials = (patientId) => {
  // Simulated library
  return [
    { title: 'Recovering from Surgery', type: 'VIDEO', url: '#' },
    { title: 'Medication Schedule 101', type: 'PDF', url: '#' }
  ];
};
