
import admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK.
// It's designed to be idempotent, meaning it will only initialize the app once,
// even if called multiple times.
function initializeFirebaseAdmin() {
  // Check if the app is already initialized to prevent errors.
  if (admin.apps.length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        console.warn("Firebase Admin SDK not initialized. Missing required environment variables.");
        return; // Exit if essential variables are missing.
    }
    
    try {
      // The private key from environment variables often has escaped newlines.
      // We need to replace them with actual newlines for the SDK to parse it correctly.
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formattedPrivateKey,
        }),
      });
       console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      // Log a more descriptive error to help with debugging.
      console.error("Firebase admin initialization error:", error.message);
      throw new Error("Could not initialize Firebase Admin SDK. Please check server logs for details.");
    }
  }
}


// This is a getter function to ensure the SDK is initialized before returning services.
export function getFirebaseAdmin() {
  initializeFirebaseAdmin();
  
  // After attempting initialization, if there are still no apps, it means it failed.
  if (admin.apps.length === 0) {
    throw new Error("Firebase Admin SDK is not initialized. API Route cannot function.");
  }
  
  // Return the initialized services.
  return {
    auth: admin.auth(),
    db: admin.firestore(),
  };
}
