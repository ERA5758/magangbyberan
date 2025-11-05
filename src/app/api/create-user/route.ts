import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin';
import type { AppUser } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const admin = initializeAdminApp();
    const db = admin.firestore();
    
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
      await admin.auth().getUserByEmail(userData.email);
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
    const userRecord = await admin.auth().createUser({
      email: userData.email,
      password: password,
      displayName: userData.name,
      disabled: userData.status !== 'Aktif',
    });

    // Set custom claims if needed (e.g., role)
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: userData.role });

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
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
