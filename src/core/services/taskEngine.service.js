/**
 * NurseFlow Enterprise HIS — Task & Worklist Engine Service
 * Centralized Multidisciplinary Operational Task Manager
 * Tasks: Lab Processing, Pharmacy Dispensing, Nursing Medication Administration, HIM Medical Coding, Billing Verification.
 * Lifecycle: OPEN → ASSIGNED → IN_PROGRESS → COMPLETED → CANCELLED → OVERDUE → ESCALATED
 */

export const TASK_STATUS = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  OVERDUE: 'OVERDUE',
  ESCALATED: 'ESCALATED'
};

export const TASK_PRIORITY = {
  ROUTINE: 'ROUTINE',
  URGENT: 'URGENT',
  STAT: 'STAT'                  // CITO
};

class TaskEngine {
  constructor() {
    this.tasks = new Map();
    this.initializeSampleTasks();
  }

  initializeSampleTasks() {
    // Clean state on Day-1 Go-Live
  }

  createTask({ taskType, title, patientId, patientName, encounterId, sourceEntityType, sourceEntityId, assignedDepartmentId, assignedTo = null, priority = TASK_PRIORITY.ROUTINE, dueAt = null }) {
    const taskId = `TSK-${Date.now()}`;
    const newTask = {
      id: taskId,
      taskType,
      title,
      patientId,
      patientName,
      encounterId,
      sourceEntityType,
      sourceEntityId,
      assignedDepartmentId,
      assignedTo,
      priority,
      status: TASK_STATUS.OPEN,
      dueAt: dueAt || new Date(Date.now() + 3600000).toISOString(), // Default 1 Hour Due
      completedAt: null,
      created_at: new Date().toISOString()
    };

    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  completeTask(taskId, operatorName = 'Staff') {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = TASK_STATUS.COMPLETED;
    task.completedAt = new Date().toISOString();
    task.completedBy = operatorName;

    this.tasks.set(task.id, task);
    return task;
  }

  getTasksByDepartment(departmentId) {
    return Array.from(this.tasks.values()).filter(t => t.assignedDepartmentId === departmentId);
  }
}

export const taskEngine = new TaskEngine();
export default taskEngine;
