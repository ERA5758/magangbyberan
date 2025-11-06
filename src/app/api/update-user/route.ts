
import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { AppUser } from '@/lib/types';

let auth, db;
try {
  ({ auth, db } = getFirebaseAdmin());
} catch (error: any) {
  console.error('API Route Initialization Error: Firebase Admin init failed:', error);
}

export async function PUT(req: NextRequest) {
  if (!auth || !db) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized. Check server logs.' }, { status: 500 });
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    const callerDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'Admin') {
      return NextResponse.json({ error: 'Permission denied: Caller is not an admin.' }, { status: 403 });
    }

    const userData = await req.json();
    const { uid, ...dataToUpdate } = userData;

    if (!uid) {
        return NextResponse.json({ error: 'User UID is required' }, { status: 400 });
    }
    
    // Validate NIK uniqueness if it's being changed
    if (dataToUpdate.nik) {
        const nikQuery = await db.collection('users').where('nik', '==', dataToUpdate.nik).get();
        const nikExists = nikQuery.docs.some(doc => doc.id !== uid);
        if (nikExists) {
            return NextResponse.json({ error: `NIK_EXISTS: NIK ${dataToUpdate.nik} sudah terdaftar.` }, { status: 409 });
        }
    }

    // Validate sales code uniqueness if role is Sales
    if (dataToUpdate.role === 'Sales' && dataToUpdate.projectAssignments && dataToUpdate.projectAssignments.length > 0) {
        const salesUsersSnapshot = await db.collection('users')
            .where('role', '==', 'Sales')
            .get();
            
        const existingSalesCodes = new Set<string>();
        salesUsersSnapshot.forEach(doc => {
            if (doc.id !== uid) { // Exclude the current user from the check
                const user = doc.data() as AppUser;
                user.projectAssignments?.forEach(pa => {
                    existingSalesCodes.add(pa.salesCode);
                });
            }
        });

        const newSalesCodes = dataToUpdate.projectAssignments.map((pa: any) => pa.salesCode);
        for (const code of newSalesCodes) {
            if (existingSalesCodes.has(code)) {
                return NextResponse.json({ error: `SALES_CODE_EXISTS: Kode sales ${code} sudah digunakan.` }, { status: 409 });
            }
        }
    }

    const userRecord = await auth.getUser(uid);

    // Update Firebase Auth (displayName and role claim)
    await auth.updateUser(uid, {
        displayName: dataToUpdate.name,
    });
    await auth.setCustomUserClaims(uid, { role: dataToUpdate.role });

    // Update Firestore document
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update(dataToUpdate);

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('API Error updating user:', error);
    let errorMessage = 'An unexpected error occurred.';
    let statusCode = 500;
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
        errorMessage = 'Authorization token is invalid or has expired.';
        statusCode = 401;
    } else if (error.message) {
        errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
