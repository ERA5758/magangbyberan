
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDocs, Query, CollectionReference } from 'firebase/firestore';

export function useCollectionOnce<T>(q: Query | CollectionReference | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!q) {
      setLoading(false);
      setData([]); // Return empty array instead of null
      return;
    }

    setLoading(true);
    try {
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setData(data);
    } catch (e) {
      setError(e as Error);
      setData([]); // Return empty array on error
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, mutate: fetchData };
}
