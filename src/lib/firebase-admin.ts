
import admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK.
// It's designed to be idempotent, meaning it will only initialize the app once,
// even if called multiple times.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

  if (!serviceAccountKeyBase64) {
    throw new Error(
      'Firebase Admin SDK initialization failed: FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 environment variable is not set.'
    );
  }

  try {
    const serviceAccountJson = Buffer.from(
      serviceAccountKeyBase64,
      'base64'
    ).toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);

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
