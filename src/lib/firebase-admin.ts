
import admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON)
  : undefined;

export function initializeAdminApp() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}
