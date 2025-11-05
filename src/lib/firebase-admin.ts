
import admin from 'firebase-admin';

export function initializeAdminApp() {
  // If the app is already initialized, don't try to initialize it again.
  if (admin.apps.length > 0) {
    return admin;
  }
  
  let serviceAccount: admin.ServiceAccount | undefined;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON as string);
    } catch (e) {
      console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
      throw new Error('Firebase Admin SDK service account credentials are not set or are invalid. Please check your environment variables.');
    }
  }

  if (!serviceAccount) {
    throw new Error('Firebase Admin SDK service account credentials are not set or are invalid. Please check your environment variables.');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  return admin;
}
