
import admin from 'firebase-admin';

let serviceAccount: admin.ServiceAccount | undefined;

// The primary method for server-side environments is to parse the JSON key
// from an environment variable.
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  } catch (e) {
    console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
  }
}

export function initializeAdminApp() {
  if (!admin.apps.length) {
    if (!serviceAccount) {
      throw new Error('Firebase Admin SDK service account credentials are not set or are invalid. Please check your environment variables.');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}
