
"use client"
import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from "firebase/firestore";
import type { ProjectAssignment } from '@/lib/types';


export type AppUser = {
  id: string;
  uid: string;
  name: string;
  email: string | null;
  role: 'Admin' | 'SPV' | 'Sales';
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
          // Find a primary sales code if multiple exist
          const primarySalesCode = data.projectAssignments && data.projectAssignments.length > 0 
            ? data.projectAssignments[0].salesCode 
            : data.salesCode || '';

          setAppUser({
            id: doc.id,
            uid: authUser.uid,
            name: data.name || 'No Name',
            email: authUser.email,
            role: data.role || 'Sales',
            avatar: authUser.photoURL || data.avatar || `https://i.pravatar.cc/150?u=${authUser.uid}`,
            salesCode: primarySalesCode, // For components expecting a single sales code
            ...data
          });
        } else {
          // This might happen if user exists in Auth but not in Firestore
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

  return { user: appUser, loading: userLoading };
};

