import { useState, useEffect } from 'react';
import { listenToMetrics, listenToActiveTriage, listenToAuditLogs } from '../services/dashboard.service.js';

export const useLiveDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [activeTriage, setActiveTriage] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState({
    metrics: true,
    triage: true,
    logs: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const unsubMetrics = listenToMetrics((data, err) => {
      if (err) {
        setErrors(prev => ({ ...prev, metrics: err }));
      } else {
        setMetrics(data);
      }
      setLoading(prev => ({ ...prev, metrics: false }));
    });

    const unsubTriage = listenToActiveTriage((data, err) => {
      if (err) {
        setErrors(prev => ({ ...prev, triage: err }));
      } else {
        setActiveTriage(data);
      }
      setLoading(prev => ({ ...prev, triage: false }));
    });

    const unsubLogs = listenToAuditLogs((data, err) => {
      if (err) {
        setErrors(prev => ({ ...prev, logs: err }));
      } else {
        setAuditLogs(data);
      }
      setLoading(prev => ({ ...prev, logs: false }));
    });

    return () => {
      unsubMetrics();
      unsubTriage();
      unsubLogs();
    };
  }, []);

  const isLoading = loading.metrics || loading.triage || loading.logs;

  return {
    metrics,
    activeTriage,
    auditLogs,
    isLoading,
    loadingStates: loading,
    errors
  };
};
