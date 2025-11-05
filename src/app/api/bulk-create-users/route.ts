
import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { AppUser } from '@/lib/types';

// Initialize Firebase Admin SDK immediately to catch any errors early.
let auth, db;
try {
  ({ auth, db } = getFirebaseAdmin());
} catch (error: any) {
  console.error('API Route Initialization Error: Firebase Admin init failed:', error);
  // We can't respond to requests if the admin SDK fails, but this logs the error.
}

async function parseCSV(file: File): Promise<any[]> {
    const text = await file.text();
    const rows = text.split('\n').filter(row => row.trim() !== '');
    if (rows.length < 2) return [];

    const header = rows[0].split(',').map(h => h.trim());
    
    return rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim());
        return header.reduce((obj, nextKey, index) => {
            obj[nextKey] = values[index];
            return obj;
        }, {} as { [key: string]: string });
    });
}


export async function POST(req: NextRequest) {
    // Check if initialization failed during startup
    if (!auth || !db) {
        return NextResponse.json({ error: 'Firebase Admin SDK not initialized. Check server logs.' }, { status: 500 });
    }

    try {
        // 1. Verify Authorization
        const authorization = req.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(idToken);

        // 2. Verify Caller is Admin
        const callerDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (!callerDoc.exists || callerDoc.data()?.role !== 'Admin') {
            return NextResponse.json({ error: 'Permission denied: Caller is not an admin.' }, { status: 403 });
        }
        
        // 3. Process File
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        const usersToCreate = await parseCSV(file);
        
        const results = {
            totalRows: usersToCreate.length,
            successCount: 0,
            errorCount: 0,
            errors: [] as { row: number, reason: string }[],
        };

        // Pre-fetch existing data for validation
        const [nikSnapshot, emailSnapshot, salesCodeSnapshot] = await Promise.all([
             db.collection('users').select('nik').get(),
             db.collection('users').select('email').get(),
             db.collection('users').select('projectAssignments').get(),
        ]);
        const existingNiks = new Set(nikSnapshot.docs.map(doc => doc.data().nik));
        const existingEmails = new Set(emailSnapshot.docs.map(doc => doc.data().email));
        const existingSalesCodes = new Set<string>();
        salesCodeSnapshot.forEach(doc => {
            const user = doc.data() as AppUser;
            user.projectAssignments?.forEach(pa => {
                existingSalesCodes.add(pa.salesCode);
            });
        });


        for (let i = 0; i < usersToCreate.length; i++) {
            const userData = usersToCreate[i];
            const rowNumber = i + 2; // CSV row number (1-based, including header)
            
            try {
                // 4. Validate each user
                const { name, email, password, role, nik, projectAssignments } = userData;
                if (!name || !email || !password || !role || !nik) {
                    throw new Error("Kolom wajib (name, email, password, role, nik) tidak boleh kosong.");
                }
                
                if (existingEmails.has(email)) {
                    throw new Error(`Email ${email} sudah terdaftar.`);
                }
                if (existingNiks.has(nik)) {
                    throw new Error(`NIK ${nik} sudah terdaftar.`);
                }
                
                const parsedAssignments: { projectId: string; salesCode: string; }[] = [];
                if (role === 'Sales' && projectAssignments) {
                    const assignments = projectAssignments.split(';').filter(Boolean);
                    if (assignments.length === 0) {
                        throw new Error("Sales harus memiliki setidaknya satu penugasan proyek.");
                    }
                    for (const assignment of assignments) {
                        const [projectId, salesCode] = assignment.split(':');
                        if (!projectId || !salesCode) {
                            throw new Error("Format penugasan proyek tidak valid. Gunakan 'projectId:salesCode'.");
                        }
                        if (existingSalesCodes.has(salesCode)) {
                             throw new Error(`Kode sales '${salesCode}' sudah digunakan.`);
                        }
                        parsedAssignments.push({ projectId, salesCode });
                        existingSalesCodes.add(salesCode); // Add to set to prevent duplicate in the same file
                    }
                }
                
                if (role === 'Sales' && !userData.supervisorId) {
                    throw new Error("Sales harus memiliki supervisorId.");
                }

                // 5. Create user (Auth and Firestore)
                const userRecord = await auth.createUser({
                    email,
                    password,
                    displayName: name,
                    disabled: false,
                });

                await auth.setCustomUserClaims(userRecord.uid, { role });
                
                const userDocRef = db.collection('users').doc(userRecord.uid);
                
                const dataToSave: Omit<AppUser, 'id' | 'avatar'> & { createdAt: any } = {
                    uid: userRecord.uid,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role as any,
                    status: 'Aktif',
                    nik: userData.nik,
                    address: userData.address || '',
                    phone: userData.phone || '',
                    bankName: userData.bankName || '',
                    accountNumber: userData.accountNumber || '',
                    accountHolder: userData.accountHolder || '',
                    createdAt: new Date().toISOString(),
                    projectAssignments: parsedAssignments,
                    supervisorId: role === 'Sales' ? userData.supervisorId : undefined,
                };

                await userDocRef.set(dataToSave);
                
                // Add to existing sets to validate subsequent rows in the same file
                existingEmails.add(email);
                existingNiks.add(nik);
                
                results.successCount++;

            } catch (error: any) {
                results.errorCount++;
                results.errors.push({ row: rowNumber, reason: error.message });
            }
        }

        return NextResponse.json(results, { status: 200 });

    } catch (error: any) {
        console.error('API Error during bulk create:', error);
        let errorMessage = 'An unexpected server error occurred.';
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
            return NextResponse.json({ error: 'Authorization token is invalid or has expired.' }, { status: 401 });
        }
        if (error.message) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
