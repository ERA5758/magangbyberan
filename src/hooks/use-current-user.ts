"use client"
import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from "firebase/firestore";
import type { User as AuthUser } from 'firebase/auth';

export type AppUser = {
  uid: string;
  name: string;
  email: string | null;
  role: 'Admin' | 'SPV' | 'Sales';
  avatar: string;
  salesCode: string;
  [key: string]: any; // Allow other properties
};

export const useCurrentUser = () => {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser && firestore) {
      const userDocRef = doc(firestore, "users", authUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setAppUser({
            uid: authUser.uid,
            name: data.name || 'No Name',
            email: authUser.email,
            role: data.role || 'Sales',
            avatar: authUser.photoURL || data.avatar || '/placeholders/user1.jpg',
            salesCode: data.salesCode || '',
            ...data
          });
        } else {
          setAppUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (!authUser) {
      setLoading(false);
      setAppUser(null);
    }
  }, [authUser, firestore]);

  return { user: appUser, loading };
};
