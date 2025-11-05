'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, CollectionReference } from 'firebase/firestore';

export function useCollection<T>(q: Query | CollectionReference | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If the query is not yet available, set loading to false and return empty data
    if (!q) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
          setData(data);
          setError(null);
        } catch (e) {
          setError(e as Error);
          setData([]);
        } finally {
          setLoading(false);
        }
      }, 
      (err) => {
        console.error("Error in useCollection snapshot:", err);
        setError(err);
        setData([]);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [q]); // Rerun effect if query object changes

  return { data, loading, error };
}
