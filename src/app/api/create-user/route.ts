
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import type { AppUser } from '@/lib/types';
import 'dotenv/config';

// Function to initialize Firebase Admin SDK
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // The SDK will automatically use GOOGLE_APPLICATION_CREDENTIALS environment variable
  // if it's set. For environments like Vercel or Cloud Run, you set the env var directly.
  // For local dev, you can point GOOGLE_APPLICATION_CREDENTIALS to the path of your JSON file.
  // Parsing the JSON from an env var can be error-prone, so this is a more robust method.
  
  const serviceAccountString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (!serviceAccountString) {
      console.error('Firebase Admin SDK service account credentials are not set.');
      // It's better to throw an error that the calling function can catch
      throw new Error('Firebase Admin SDK service account credentials are not set.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Failed to parse or initialize Firebase Admin SDK credentials:', error);
    throw new Error('Firebase Admin SDK credentials are not valid.');
  }
}

export async function POST(req: NextRequest) {
  try {
    initializeAdminApp();

    const db = admin.firestore();
    const auth = admin.auth();
    
    const { password, ...userData } = await req.json();

    if (!password || !userData.email) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Check for duplicate NIK
    const nikQuery = await db.collection('users').where('nik', '==', userData.nik).limit(1).get();
    if (!nikQuery.empty) {
        return NextResponse.json({ error: `NIK_EXISTS: NIK ${userData.nik} sudah terdaftar.` }, { status: 409 });
    }

    // 2. Check for duplicate email in Auth
    try {
      await auth.getUserByEmail(userData.email);
      return NextResponse.json({ error: 'EMAIL_EXISTS: Email ini sudah digunakan oleh akun lain.' }, { status: 409 });
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error; // Re-throw other auth errors
      }
      // If user is not found, we can proceed.
    }
    
    // 3. Check for duplicate sales codes if the user is a Sales role
    if (userData.role === 'Sales' && userData.projectAssignments && userData.projectAssignments.length > 0) {
        const salesUsersSnapshot = await db.collection('users').where('role', '==', 'Sales').get();
        const existingSalesCodes = new Set<string>();
        salesUsersSnapshot.forEach(doc => {
            const user = doc.data() as AppUser;
            user.projectAssignments?.forEach(pa => {
                existingSalesCodes.add(pa.salesCode);
            });
        });

        const newSalesCodes = userData.projectAssignments.map((pa: any) => pa.salesCode);
        for (const code of newSalesCodes) {
            if (existingSalesCodes.has(code)) {
                return NextResponse.json({ error: `SALES_CODE_EXISTS: Kode sales ${code} sudah digunakan.` }, { status: 409 });
            }
        }
    }


    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: userData.email,
      password: password,
      displayName: userData.name,
      disabled: userData.status !== 'Aktif',
    });

    // Set custom claims if needed (e.g., role)
    await auth.setCustomUserClaims(userRecord.uid, { role: userData.role });

    // Save user data to Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const dataToSave: Omit<AppUser, 'id'> = {
        ...userData,
        uid: userRecord.uid,
    };

    if (userData.role !== 'Sales') {
      delete dataToSave.supervisorId;
    }

    await userDocRef.set(dataToSave);

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 });

  } catch (error: any) {
    console.error('API Error creating user:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.message && error.message.includes('credentials')) {
        errorMessage = error.message;
    } else if (error.code) {
        switch (error.code) {
            case 'auth/email-already-exists':
                errorMessage = 'EMAIL_EXISTS: Email ini sudah digunakan oleh akun lain.';
                break;
            case 'auth/invalid-password':
                errorMessage = 'WEAK_PASSWORD: Kata sandi harus minimal 6 karakter.';
                break;
            default:
                errorMessage = error.message;
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
