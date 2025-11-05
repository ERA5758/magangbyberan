
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let serviceAccount: admin.ServiceAccount | undefined;

// Prefer reading from a file path specified in an environment variable
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }
  } catch (e) {
    console.error(`Error reading service account file from path: ${process.env.FIREBASE_SERVICE_ACCOUNT}`, e);
  }
}

// Fallback to parsing the JSON directly from an environment variable
if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);
  } catch (e) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY_JSON:', e);
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
