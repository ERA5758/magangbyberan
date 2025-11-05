
"use client"
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import type { ProjectAssignment } from '@/lib/types';


export type AppUser = {
  id: string;
  uid: string;
  name: string;
  email: string | null;
  role: 'Admin' | 'SPV' | 'Sales';
  status: 'Aktif' | 'Non Aktif' | 'Menunggu Persetujuan';
  avatar: string;
  projectAssignments?: ProjectAssignment[];
  salesCode?: string; // for backward compatibility if needed, but should be deprecated
  [key: string]: any; // Allow other properties
};

export const useCurrentUser = () => {
  const { user: authUser, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const fetchAppUser = useCallback(async () => {
    if (firestore && authUser) {
      const userDocRef = doc(firestore, "users", authUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const primarySalesCode = data.projectAssignments && data.projectAssignments.length > 0 
          ? data.projectAssignments[0].salesCode 
          : data.salesCode || '';

        setAppUser({
          id: docSnap.id,
          uid: authUser.uid,
          name: data.name || 'No Name',
          email: authUser.email,
          role: data.role || 'Sales',
          status: data.status || 'Aktif',
          avatar: authUser.photoURL || data.avatar || `https://i.pravatar.cc/150?u=${authUser.uid}`,
          salesCode: primarySalesCode,
          ...data
        });
      } else {
        setAppUser(null);
      }
    }
  }, [firestore, authUser]);

  useEffect(() => {
    if (authLoading) {
      setUserLoading(true);
      return;
    }

    if (!authUser) {
      setAppUser(null);
      setUserLoading(false);
      return;
    }
    
    if (firestore) {
      const userDocRef = doc(firestore, "users", authUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const primarySalesCode = data.projectAssignments && data.projectAssignments.length > 0 
            ? data.projectAssignments[0].salesCode 
            : data.salesCode || '';

          setAppUser({
            id: doc.id,
            uid: authUser.uid,
            name: data.name || 'No Name',
            email: authUser.email,
            role: data.role || 'Sales',
            status: data.status || 'Aktif',
            avatar: authUser.photoURL || data.avatar || `https://i.pravatar.cc/150?u=${authUser.uid}`,
            salesCode: primarySalesCode,
            ...data
          });
        } else {
          setAppUser(null); 
        }
        setUserLoading(false);
      }, (error) => {
        console.error("Error fetching user data from Firestore:", error);
        setAppUser(null);
        setUserLoading(false);
      });

      return () => unsubscribe();
    }
  }, [authUser, firestore, authLoading]);

  return { user: appUser, loading: userLoading, mutate: fetchAppUser };
};
