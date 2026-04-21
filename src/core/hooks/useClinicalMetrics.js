import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useClinicalMetrics
 * Measures the effectiveness of the design architecture on human performance.
 * Tracks "Time to Meaningful Action" and "Interaction Velocity".
 */
export const useClinicalMetrics = (pageName) => {
  const location = useLocation();
  const [metrics, setMetrics] = useState({
    timeToFirstAction: null,
    totalInteractionSpeed: 0,
    actionCount: 0
  });

  const startTimeRef = useRef(performance.now());
  const hasActedRef = useRef(false);

  // ⏱️ Track "Time to First Action" (Cognitive Load Indicator)
  const logAction = useCallback((actionName = 'unnamed-action') => {
    if (!hasActedRef.current) {
      const duration = performance.now() - startTimeRef.current;
      hasActedRef.current = true;
      
      const sessionMetric = {
        page: pageName || location.pathname,
        timeToFirstAction: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      };

      console.log('%c📊 CLINICAL METRIC (First Action)', 'background: #005eb8; color: white; padding: 2px 5px; border-radius: 4px;', sessionMetric);
      
      setMetrics(prev => ({ ...prev, timeToFirstAction: duration }));
    }

    setMetrics(prev => ({ ...prev, actionCount: prev.actionCount + 1 }));
  }, [location.pathname, pageName]);

  // Reset timer on navigation
  useEffect(() => {
    startTimeRef.current = performance.now();
    hasActedRef.current = false;
  }, [location.pathname]);

  return { metrics, logAction };
};
