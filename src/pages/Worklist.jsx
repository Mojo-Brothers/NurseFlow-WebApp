/**
 * Nursing Worklist — Task & Medication Round Page
 * Didesain untuk perawat: cepat, satu-klik update status.
 */
import React, { useEffect, useState } from 'react';
import { getShiftTasks, updateTaskStatus, createTask } from '../modules/worklist/worklist.service.js';
import { usePatientStore } from '../modules/patient/patient.store.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const TASK_ICONS = {
  MEDICATION:   'medication',
  VITAL_CHECK:  'monitor_heart',
  WOUND_CARE:   'healing',
  LAB_DRAW:     'biotech',
  CUSTOM:       'task_alt',
};

const STATUS_COLORS = {
  PENDING:     { bg: '#fef9c3', text: '#92400e', label: 'Pending'     },
  IN_PROGRESS: { bg: '#dbeafe', text: '#1e40af', label: 'Dalam Proses'},
  DONE:        { bg: '#dcfce7', text: '#166534', label: 'Selesai'     },
  SKIPPED:     { bg: '#f3f4f6', text: '#6b7280', label: 'Dilewati'   },
};

const TASK_TYPE_LABELS = {
  MEDICATION:  'Pemberian Obat',
  VITAL_CHECK: 'Cek Vital',
  WOUND_CARE:  'Perawatan Luka',
  LAB_DRAW:    'Ambil Darah',
  CUSTOM:      'Tugas Lain',
};

export default function Worklist() {
  const { currentUser, isNurse, isAdmin } = useAuth();
  const { patients, fetchPatients } = usePatientStore();
  const [tasks, setTasks]           = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter]         = useState('ALL');
  const [newTask, setNewTask]        = useState({
    patientId: '', taskType: 'VITAL_CHECK', description: '', dueTime: '',
  });
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadTasks();
    fetchPatients();
  }, [fetchPatients]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await getShiftTasks(currentUser.email);
      setTasks(data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      await updateTaskStatus(taskId, newStatus, currentUser.email);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (e) { alert(e.message); }
    setUpdatingId(null);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTask({ ...newTask, assignedTo: currentUser.email, createdBy: currentUser.email });
      setIsModalOpen(false);
      setNewTask({ patientId: '', taskType: 'VITAL_CHECK', description: '', dueTime: '' });
      loadTasks();
    } catch (e) { alert(e.message); }
  };

  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);
  const getPatientName = (pid) => {
    const p = patients.find(p => p.id === pid);
    return p ? p.name : pid;
  };

  const pending   = tasks.filter(t => t.status === 'PENDING').length;
  const done      = tasks.filter(t => t.status === 'DONE').length;
  const progress  = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex-row items-start justify-between mb-8">
        <div>
          <p className="subtitle">Shift Board</p>
          <h2 className="title">Nursing Worklist</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Tugas shift · {pending} pending · {done}/{tasks.length} selesai
          </p>
        </div>
        <button className="btn-primary flex-row items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add_task</span>
          Tambah Tugas
        </button>
      </div>

      {/* Progress Bar */}
      <div className="card mb-6" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="flex-row items-center justify-between mb-3">
          <div className="flex-row items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.1rem' }}>trending_up</span>
            <p className="font-bold text-sm">Progress Shift</p>
          </div>
          <p style={{ fontFamily: 'var(--font-headline)', fontWeight: '800', fontSize: '1.5rem', color: 'var(--secondary)', margin: 0 }}>
            {progress}%
          </p>
        </div>
        <div style={{ height: '8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--surface-container-high)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`, borderRadius: 'var(--radius-full)',
            backgroundColor: progress === 100 ? 'var(--secondary)' : 'var(--primary)',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex-row gap-2 mb-6 flex-wrap">
        {['ALL', 'PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', border: 'none',
              fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: filter === f ? 'var(--primary)' : 'var(--surface-container)',
              color: filter === f ? 'white' : 'var(--on-surface-variant)',
            }}>
            {f === 'ALL' ? `Semua (${tasks.length})` : STATUS_COLORS[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Task Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {isLoading ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1/-1' }}>
            <span className="material-symbols-outlined anim-spin text-primary">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1/-1' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', opacity: 0.3, display: 'block', marginBottom: '0.75rem' }}>task_alt</span>
            <p style={{ color: 'var(--on-surface-variant)' }}>Tidak ada tugas dengan filter ini.</p>
          </div>
        ) : filtered.map(task => {
          const sc = STATUS_COLORS[task.status] || STATUS_COLORS.PENDING;
          const isUpdating = updatingId === task.id;
          return (
            <div key={task.id} className="card" style={{
              borderLeft: `4px solid ${sc.bg === '#f3f4f6' ? 'var(--outline-variant)' : sc.bg === '#dcfce7' ? 'var(--secondary)' : 'var(--primary)'}`,
              opacity: task.status === 'DONE' || task.status === 'SKIPPED' ? 0.7 : 1,
              transition: 'all 0.2s',
            }}>
              <div className="flex-row items-start justify-between mb-3">
                <div className="flex-row items-center gap-2">
                  <div style={{
                    width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                      {TASK_ICONS[task.task_type] || 'task_alt'}
                    </span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                      {TASK_TYPE_LABELS[task.task_type] || task.task_type}
                    </p>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: 'var(--on-surface)' }}>
                      {getPatientName(task.patient_id)}
                    </p>
                  </div>
                </div>
                <span style={{
                  padding: '2px 10px', borderRadius: 'var(--radius-full)',
                  fontSize: '0.65rem', fontWeight: '800', flexShrink: 0,
                  backgroundColor: sc.bg, color: sc.text,
                }}>{sc.label}</span>
              </div>

              <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                {task.description || '—'}
              </p>

              {task.due_time && (
                <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>schedule</span>
                  {task.due_time}
                </p>
              )}

              {/* Action Buttons */}
              {task.status === 'PENDING' && (
                <div className="flex-row gap-2 mt-auto">
                  <button disabled={isUpdating} onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>
                    {isUpdating ? '...' : '▶ Mulai'}
                  </button>
                  <button disabled={isUpdating} onClick={() => handleStatusUpdate(task.id, 'SKIPPED')}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', backgroundColor: 'transparent', color: 'var(--on-surface-variant)', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Skip
                  </button>
                </div>
              )}
              {task.status === 'IN_PROGRESS' && (
                <button disabled={isUpdating} onClick={() => handleStatusUpdate(task.id, 'DONE')}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--secondary)', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', marginTop: 'auto' }}>
                  {isUpdating ? '...' : '✓ Tandai Selesai'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ width: '480px', maxWidth: '95vw' }}>
            <div className="flex-row items-center justify-between mb-6">
              <h3 className="font-bold text-xl">Tambah Tugas Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '4px' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="flex-column gap-4">
              <div>
                <label className="metric-label mb-2 block">PASIEN *</label>
                <select required className="form-input" value={newTask.patientId}
                  onChange={e => setNewTask({ ...newTask, patientId: e.target.value })}>
                  <option value="">-- Pilih Pasien --</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.mrn} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="metric-label mb-2 block">TIPE TUGAS *</label>
                <select required className="form-input" value={newTask.taskType}
                  onChange={e => setNewTask({ ...newTask, taskType: e.target.value })}>
                  {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="metric-label mb-2 block">DESKRIPSI *</label>
                <textarea required rows={2} className="form-input" placeholder="Detail tugas..."
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
              </div>
              <div>
                <label className="metric-label mb-2 block">WAKTU PELAKSANAAN</label>
                <input type="time" className="form-input" value={newTask.dueTime}
                  onChange={e => setNewTask({ ...newTask, dueTime: e.target.value })} />
              </div>
              <div className="flex-row justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--outline-variant)' }}>
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Tambah Tugas</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
