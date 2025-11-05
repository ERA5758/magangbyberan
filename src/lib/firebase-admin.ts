
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!serviceAccountString) {
    throw new Error('The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set.');
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e: any) {
    console.error('Failed to parse or initialize Firebase Admin SDK credentials:', e);
    throw new Error('The service account credentials are not valid.');
  }
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
