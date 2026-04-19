/**
 * usePagination — Step 8: Performance
 * Cursor-based Firestore pagination untuk Patient Directory.
 * Menghindari full-collection scan.
 */
import { useState, useCallback } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../core/firebase.js';
import { COLLECTIONS } from '../core/constants.js';

const PAGE_SIZE = 20;

export function usePatientPagination() {
  const [patients, setPatients] = useState([]);
  const [lastDoc,  setLastDoc]  = useState(null);
  const [hasMore,  setHasMore]  = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);

  // Muat halaman pertama
  const loadFirst = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, COLLECTIONS.PATIENTS),
        orderBy('registered_at', 'desc'),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPatients(docs);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
      setPage(1);
    } catch (err) {
      console.error('[usePagination] loadFirst:', err);
    }
    setIsLoading(false);
  }, []);

  // Muat halaman berikutnya
  const loadNext = useCallback(async () => {
    if (!lastDoc || !hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, COLLECTIONS.PATIENTS),
        orderBy('registered_at', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const newDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPatients(prev => [...prev, ...newDocs]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
      setPage(p => p + 1);
    } catch (err) {
      console.error('[usePagination] loadNext:', err);
    }
    setIsLoading(false);
  }, [lastDoc, hasMore, isLoading]);

  const reset = useCallback(() => {
    setPatients([]);
    setLastDoc(null);
    setHasMore(true);
    setPage(0);
  }, []);

  return { patients, isLoading, hasMore, page, loadFirst, loadNext, reset };
}
