import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../core/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { SYSTEM_VERSION, SCHEMA_VERSION } from '../../../core/constants';

const HealthCheckPage = () => {
  const [status, setStatus] = useState({
    firestore: 'PENDING',
    auth:      'PENDING',
    offline:   navigator.onLine ? 'ONLINE' : 'OFFLINE',
    latency:   null
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      const startTime = Date.now();
      
      // 1. Test Auth
      const currentUser = auth.currentUser;
      const authStatus = currentUser ? 'AUTHENTICATED' : 'ANONYMOUS';

      // 2. Test Firestore Read (Public Metadata or dummy)
      let firestoreStatus = 'OK';
      let latency = 0;
      try {
        // Just a light check to see if we can talk to the DB
        await getDoc(doc(db, 'system_metrics', 'heartbeat'));
        latency = Date.now() - startTime;
      } catch (err) {
        firestoreStatus = 'ERROR';
        console.error('[HealthCheck] Firestore Failed:', err);
      }

      setStatus({
        firestore: firestoreStatus,
        auth:      authStatus,
        offline:   navigator.onLine ? 'ONLINE' : 'OFFLINE',
        latency:   latency
      });
    };

    runDiagnostics();
  }, []);

  const StatusIcon = ({ state }) => {
    if (state === 'OK' || state === 'ONLINE' || state === 'AUTHENTICATED') return <span style={{ color: '#10b981' }}>● READY</span>;
    if (state === 'PENDING') return <span style={{ color: '#f59e0b' }}>● CHECKING</span>;
    return <span style={{ color: '#ef4444' }}>● FAILED</span>;
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '12px' }}>
          🏥 NurseFlow System Pulse
        </h1>
        <p style={{ color: '#6b7280' }}>Diagnostic Dashboard for JCI Compliance & Site Reliability</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Card title="Firebase Connectivity" value={<StatusIcon state={status.firestore} />} detail={status.latency ? `Latency: ${status.latency}ms` : '---'} />
        <Card title="Identity Access" value={<StatusIcon state={status.auth} />} detail={auth.currentUser?.email || 'Unauthorized'} />
        <Card title="Network Environment" value={<StatusIcon state={status.offline} />} detail={navigator.userAgent.slice(0, 30) + '...'} />
      </div>

      <div style={{ marginTop: '40px', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1 -solid #e5e7eb' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          System Artifacts
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <TableRow label="System Build" value={SYSTEM_VERSION} />
            <TableRow label="Schema Engine" value={`v${SCHEMA_VERSION}`} />
            <TableRow label="JCI Audit Level" value="Enterprise (Spark-Safe)" />
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Card = ({ title, value, detail }) => (
  <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
    <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>{title}</h3>
    <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{detail}</div>
  </div>
);

const TableRow = ({ label, value }) => (
  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
    <td style={{ padding: '12px 0', fontSize: '0.875rem', color: '#6b7280' }}>{label}</td>
    <td style={{ padding: '12px 0', fontSize: '0.875rem', fontWeight: '600', textAlign: 'right' }}>{value}</td>
  </tr>
);

export default HealthCheckPage;
