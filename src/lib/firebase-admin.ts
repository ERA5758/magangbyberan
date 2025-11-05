
import admin from 'firebase-admin';

// This guard prevents re-initialization on hot reloads
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('The FIREBASE_PRIVATE_KEY environment variable is not set.');
  }
  
  // The private key is often stored base64 encoded, let's decode it.
  // And also replace all \\n with \n
  const decodedPrivateKey = Buffer.from(privateKey, 'base64').toString('utf8').replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: decodedPrivateKey,
      }),
    });
  } catch (e: any) {
    console.error('Failed to initialize Firebase Admin SDK credentials.', e);
    // Provide a more helpful error message
    if (e.message.includes('json')) {
         throw new Error('Firebase Admin SDK credentials error: Check if the environment variables are set correctly.');
    }
    throw e;
  }
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
