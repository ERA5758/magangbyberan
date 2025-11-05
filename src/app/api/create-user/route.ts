
import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin';
import type { AppUser } from '@/lib/types';
import 'dotenv/config'

export async function POST(req: NextRequest) {
  try {
    const admin = initializeAdminApp();
    const db = admin.firestore();
    
    const { password, ...userData } = await req.json();

    if (!password || !userData.email) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // --- Server-side Validation ---
    const { nik, email, projectAssignments, role } = userData;

    // Check for duplicate NIK
    const nikQuery = await db.collection('users').where('nik', '==', nik).limit(1).get();
    if (!nikQuery.empty) {
      return NextResponse.json({ error: `NIK ${nik} sudah terdaftar.` }, { status: 409 });
    }

    // Check for duplicate email (Firestore check as a fallback)
    const emailQuery = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!emailQuery.empty) {
      return NextResponse.json({ error: `Email ${email} sudah terdaftar.` }, { status: 409 });
    }
    
    // Check for duplicate Sales Code ONLY for Sales role
    if (role === 'Sales' && projectAssignments && projectAssignments.length > 0) {
        const salesCodesToCheck = projectAssignments.map((pa: { salesCode: string }) => pa.salesCode);
        if (salesCodesToCheck.length > 0) {
            const allSalesUsersQuery = await db.collection('users').where('role', '==', 'Sales').get();
            const existingSalesCodes = new Set<string>();
            allSalesUsersQuery.forEach(doc => {
                const user = doc.data() as AppUser;
                user.projectAssignments?.forEach(pa => {
                    existingSalesCodes.add(pa.salesCode);
                });
            });

            for (const code of salesCodesToCheck) {
                if (existingSalesCodes.has(code)) {
                    return NextResponse.json({ error: `Kode Sales '${code}' sudah digunakan.` }, { status: 409 });
                }
            }
        }
    }
    // --- End Validation ---

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
    // Provide more specific error messages from Firebase Auth
    let errorMessage = 'An unexpected error occurred.';
    if (error.code) {
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
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
