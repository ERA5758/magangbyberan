
import 'dotenv/config'; // Ensure environment variables are loaded
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { AppUser } from '@/lib/types';

export async function POST(req: NextRequest) {
  let auth, db;
  try {
    ({ auth, db } = getFirebaseAdmin());
  } catch (error: any) {
    console.error('API Error during Firebase Admin init:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    // 1. Verify the authorization token from the client
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    // 2. Check caller permissions
    const callerDocRef = db.collection('users').doc(callerUid);
    const callerDoc = await callerDocRef.get();
    const callerData = callerDoc.data();
    
    if (!callerDoc.exists || callerData?.role !== 'Admin') {
      return NextResponse.json({ error: 'Permission denied: Caller is not an admin.' }, { status: 403 });
    }

    // 3. Validate Input Data
    const { password, ...userData } = await req.json();
    if (!password || !userData.email) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 4. Check for duplicates
    const nikQuery = await db.collection('users').where('nik', '==', userData.nik).limit(1).get();
    if (!nikQuery.empty) {
        return NextResponse.json({ error: `NIK_EXISTS: NIK ${userData.nik} sudah terdaftar.` }, { status: 409 });
    }

    try {
      await auth.getUserByEmail(userData.email);
      return NextResponse.json({ error: 'EMAIL_EXISTS: Email ini sudah digunakan oleh akun lain.' }, { status: 409 });
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }
    
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

    // 5. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: userData.email,
      password: password,
      displayName: userData.name,
      disabled: userData.status !== 'Aktif',
    });

    // 6. Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: userData.role });

    // 7. Save user data to Firestore
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
    let statusCode = 500;

    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-exists':
                errorMessage = 'EMAIL_EXISTS: Email ini sudah digunakan oleh akun lain.';
                statusCode = 409;
                break;
            case 'auth/invalid-password':
                errorMessage = 'WEAK_PASSWORD: Kata sandi harus minimal 6 karakter.';
                statusCode = 400;
                break;
            case 'auth/id-token-expired':
            case 'auth/id-token-revoked':
                errorMessage = 'Token otorisasi tidak valid atau telah kedaluwarsa. Harap muat ulang halaman dan coba lagi.';
                statusCode = 401;
                break;
            default:
                errorMessage = error.message;
        }
    } else if (error.message) {
        if (error.message.includes('credential')) {
             errorMessage = 'Kesalahan konfigurasi server: Kredensial Firebase tidak valid.';
        } else {
             errorMessage = error.message;
        }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
