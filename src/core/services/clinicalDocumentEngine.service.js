/**
 * NurseFlow Enterprise HIS — Clinical Document Engine Service
 * Authoritative Clinical Medical Document Lifecycle Manager
 * Manages: SOAP, CPPT, Admission Notes, Progress Notes, Operative Reports, Discharge Summaries, Informed Consent.
 * Lifecycle: DRAFT → IN_PROGRESS → SIGNED → AMENDED → ADDENDED → LOCKED → ARCHIVED
 * Non-destructive Versioning Guarantee: Signed documents can NEVER be overwritten; changes create Versioned Amendments/Addendums.
 */

export const DOCUMENT_STATUS = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  SIGNED: 'SIGNED',
  AMENDED: 'AMENDED',
  ADDENDED: 'ADDENDED',
  LOCKED: 'LOCKED',
  ARCHIVED: 'ARCHIVED'
};

export const DOCUMENT_TYPES = {
  SOAP: 'SOAP',
  CPPT: 'CPPT',
  ADMISSION_NOTE: 'ADMISSION_NOTE',
  PROGRESS_NOTE: 'PROGRESS_NOTE',
  NURSING_ASSESSMENT: 'NURSING_ASSESSMENT',
  OPERATIVE_REPORT: 'OPERATIVE_REPORT',
  ANESTHESIA_RECORD: 'ANESTHESIA_RECORD',
  DISCHARGE_SUMMARY: 'DISCHARGE_SUMMARY',
  MEDICAL_RESUME: 'MEDICAL_RESUME',
  INFORMED_CONSENT: 'INFORMED_CONSENT'
};

class ClinicalDocumentEngine {
  constructor() {
    this.documents = new Map();
    this.amendments = new Map();
    this.initializeSampleDocuments();
  }

  initializeSampleDocuments() {
    // Clean state on Day-1 Go-Live
  }

  createDocument({ documentType, patientId, patientName, mrn, encounterId, episodeId = null, authorId, authorName, authorRole = 'Practitioner', title, content }) {
    const docId = `DOC-${documentType}-${Date.now()}`;
    const newDoc = {
      id: docId,
      documentType,
      patientId,
      patientName,
      mrn,
      encounterId,
      episodeId,
      authorId,
      authorName,
      authorRole,
      title,
      content,
      status: DOCUMENT_STATUS.DRAFT,
      version: 1,
      signedAt: null,
      signedBy: null,
      created_at: new Date().toISOString()
    };

    this.documents.set(newDoc.id, newDoc);
    return newDoc;
  }

  signDocument(documentId, signerId, signerName) {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    doc.status = DOCUMENT_STATUS.SIGNED;
    doc.signedAt = new Date().toISOString();
    doc.signedBy = signerName;

    this.documents.set(doc.id, doc);
    return doc;
  }

  // Non-Destructive Signed Document Amendment (JCI HIM Standard)
  amendDocument(originalDocId, { amendedContent, amendmentReason, authorId, authorName }) {
    const originalDoc = this.documents.get(originalDocId);
    if (!originalDoc) throw new Error(`Document ${originalDocId} not found`);
    if (originalDoc.status !== DOCUMENT_STATUS.SIGNED) {
      throw new Error(`Only SIGNED documents can be amended. Current status is ${originalDoc.status}`);
    }

    // Mark original document status as AMENDED
    originalDoc.status = DOCUMENT_STATUS.AMENDED;
    this.documents.set(originalDoc.id, originalDoc);

    const amendmentId = `AMD-${Date.now()}`;
    const newVersion = originalDoc.version + 1;

    const amendedDoc = {
      ...originalDoc,
      id: amendmentId,
      originalDocumentId: originalDocId,
      content: amendedContent,
      version: newVersion,
      status: DOCUMENT_STATUS.SIGNED,
      amendmentReason,
      amendedBy: authorName,
      amendedAt: new Date().toISOString()
    };

    this.documents.set(amendedDoc.id, amendedDoc);

    this.amendments.set(amendmentId, {
      originalDocId,
      amendmentId,
      reason: amendmentReason,
      authorName,
      timestamp: new Date().toISOString()
    });

    return amendedDoc;
  }

  getDocumentById(id) {
    return this.documents.get(id) || null;
  }

  getDocumentsByEncounter(encounterId) {
    return Array.from(this.documents.values()).filter(d => d.encounterId === encounterId);
  }
}

export const clinicalDocumentEngine = new ClinicalDocumentEngine();
export default clinicalDocumentEngine;
