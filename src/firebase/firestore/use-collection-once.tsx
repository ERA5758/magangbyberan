'use client';

import { useState, useEffect } from 'react';
import { getDocs, Query, CollectionReference } from 'firebase/firestore';

export function useCollectionOnce<T>(q: Query | CollectionReference | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      setData([]); // Return empty array instead of null
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        const snapshot = await getDocs(q);
        if (isMounted) {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
          setData(data);
        }
      } catch (e) {
        if (isMounted) {
          setError(e as Error);
          setData([]); // Return empty array on error
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [q]);

  return { data, loading, error };
}
