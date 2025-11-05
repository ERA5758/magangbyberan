
import admin from 'firebase-admin';
import 'dotenv/config';

// This function initializes the Firebase Admin SDK.
// It's designed to be idempotent, meaning it will only initialize the app once,
// even if called multiple times.
function initializeFirebaseAdmin() {
  // Check if the app is already initialized to prevent errors.
  if (admin.apps.length === 0) {
    const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

    if (!serviceAccountKeyBase64) {
      console.error(
        'Firebase Admin SDK initialization failed: FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 environment variable is not set.'
      );
      throw new Error(
        'Server configuration error: Firebase credentials are not set.'
      );
    }

    try {
      // Decode the Base64 encoded service account key.
      const serviceAccountJson = Buffer.from(
        serviceAccountKeyBase64,
        'base64'
      ).toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
      // Log a more descriptive error to help with debugging.
      console.error('Firebase admin initialization error:', error.message);
      throw new Error(
        'Could not initialize Firebase Admin SDK. Please check server logs for details.'
      );
    }
  }
}

// This is a getter function to ensure the SDK is initialized before returning services.
export function getFirebaseAdmin() {
  initializeFirebaseAdmin();

  // After attempting initialization, if there are still no apps, it means it failed.
  if (admin.apps.length === 0) {
    throw new Error(
      'Firebase Admin SDK is not initialized. API Route cannot function.'
    );
  }

  // Return the initialized services.
  return {
    auth: admin.auth(),
    db: admin.firestore(),
  };
}
