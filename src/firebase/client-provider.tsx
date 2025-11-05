
'use client';

import React from 'react';
import { FirebaseProvider, initializeFirebase } from './index';

export const FirebaseClientProvider = ({ children }: { children: React.ReactNode }) => {
  const { app, auth, firestore, storage } = initializeFirebase();

  return (
    <FirebaseProvider value={{ app, auth, firestore, storage }}>
      {children}
    </FirebaseProvider>
  );
};
