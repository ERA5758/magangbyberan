
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey';

export function initializeAdminApp() {
  // If the app is already initialized, don't try to initialize it again.
  if (admin.apps.length > 0) {
    return admin;
  }
  
  if (!serviceAccount || !serviceAccount.project_id) {
    throw new Error('Firebase Admin SDK service account credentials are not set or are invalid.');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  return admin;
}
