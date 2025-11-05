
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure the admin app is initialized before using any of its services.
    initializeAdminApp();
    
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userRecord = await getAuth().createUser({
      email,
      password,
      emailVerified: true, // Auto-verify email on creation
    });

    res.status(200).json({ uid: userRecord.uid });
  } catch (error: any) {
    console.error('Error creating user:', error);
    // Send a more specific error message back to the client.
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
}
