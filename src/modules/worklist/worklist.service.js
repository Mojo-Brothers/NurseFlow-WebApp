/**
 * Nursing Worklist Service — Task & Medication Round Management
 * Menyimpan tugas perawat dalam satu shift.
 */
import {
  collection, addDoc, getDocs, query,
  where, orderBy, updateDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../core/firebase.js';
import { AUDIT_ACTIONS } from '../../core/constants.js';
import { createAuditLog } from '../../core/audit/auditService.js';

const WORKLIST_COLLECTION = 'nursing_tasks';

/**
 * @typedef {'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED'} TaskStatus
 * @typedef {'MEDICATION' | 'VITAL_CHECK' | 'WOUND_CARE' | 'LAB_DRAW' | 'CUSTOM'} TaskType
 */

export const createTask = async ({ patientId, encounterId, taskType, description, dueTime, assignedTo, createdBy }) => {
  const payload = {
    patient_id:   patientId,
    encounter_id: encounterId,
    task_type:    taskType,
    description,
    due_time:     dueTime,
    assigned_to:  assignedTo,
    status:       'PENDING',
    created_at:   serverTimestamp(),
    created_by:   createdBy,
    completed_at: null,
    notes:        '',
  };
  const ref = await addDoc(collection(db, WORKLIST_COLLECTION), payload);

  await createAuditLog({
    userEmail:    createdBy,
    action:       AUDIT_ACTIONS.CREATE,
    resourceType: WORKLIST_COLLECTION,
    resourceId:   ref.id,
    delta:        { taskType, patientId, description },
  });

  return ref.id;
};

export const updateTaskStatus = async (taskId, status, completedBy, notes = '') => {
  await updateDoc(doc(db, WORKLIST_COLLECTION, taskId), {
    status,
    completed_at: status === 'DONE' ? serverTimestamp() : null,
    completed_by: completedBy,
    notes,
  });

  await createAuditLog({
    userEmail:    completedBy,
    action:       AUDIT_ACTIONS.UPDATE,
    resourceType: WORKLIST_COLLECTION,
    resourceId:   taskId,
    delta:        { status, notes },
  });
};

export const getShiftTasks = async (nurseEmail) => {
  const q = query(
    collection(db, WORKLIST_COLLECTION),
    where('assigned_to', '==', nurseEmail),
    where('status', 'in', ['PENDING', 'IN_PROGRESS']),
    orderBy('due_time', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllShiftTasks = async () => {
  const q = query(
    collection(db, WORKLIST_COLLECTION),
    orderBy('due_time', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
