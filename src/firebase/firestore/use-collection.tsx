'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where, getDocs, Query, CollectionReference } from 'firebase/firestore';

export function useCollection<T>(q: Query | CollectionReference | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    };

    setLoading(true);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(data);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
}
