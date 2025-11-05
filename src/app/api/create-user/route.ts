
import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin';
import { AppUser } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const admin = initializeAdminApp();
    const db = admin.firestore();
    
    const { password, ...userData } = await req.json();

    if (!password || !userData.email) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: userData.email,
      password: password,
      displayName: userData.name,
      disabled: userData.status !== 'Aktif',
    });

    // Save user data to Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.set({
        ...userData,
        uid: userRecord.uid, // ensure uid is set
    });

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 });

  } catch (error: any) {
    console.error('API Error creating user:', error);
    // Provide more specific error messages
    let errorMessage = 'An unexpected error occurred.';
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-exists':
                errorMessage = 'EMAIL_EXISTS';
                break;
            case 'auth/invalid-password':
                errorMessage = 'WEAK_PASSWORD: Password should be at least 6 characters';
                break;
            default:
                errorMessage = error.message;
        }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

    