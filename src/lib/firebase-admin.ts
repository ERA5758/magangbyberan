
import admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK.
// It's designed to be idempotent, meaning it will only initialize the app once,
// even if called multiple times.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      'Firebase Admin SDK initialization failed: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.'
    );
  }

  try {
    // Directly parse the JSON from the environment variable.
    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    // Log a more descriptive error to help with debugging.
    throw new Error(
      `Firebase admin initialization error: ${error.message}`
    );
  }
}

// This is a getter function to ensure the SDK is initialized before returning services.
export function getFirebaseAdmin() {
  initializeFirebaseAdmin();
  return {
    auth: admin.auth(),
    db: admin.firestore(),
  };
}
