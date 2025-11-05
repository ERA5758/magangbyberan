
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import firebaseConfig from './config';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';

export * from './provider';
export { useCollection, useDoc, useUser };

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      firestore = getFirestore(app);
      storage = getStorage(app);
    } else {
      app = getApp();
      auth = getAuth(app);
      firestore = getFirestore(app);
      storage = getStorage(app);
    }
  }
  return { app, auth, firestore, storage };
}

export { initializeFirebase };
