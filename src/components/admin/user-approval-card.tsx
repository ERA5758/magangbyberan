
'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useAuth } from '@/firebase';
import { useCollectionOnce } from '@/firebase/firestore/use-collection-once';
import { collection, query, where, doc, updateDoc, deleteDoc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

async function createAuthUser(email: string, password?: string): Promise<{ uid: string } | { error: string }> {
  const response = await fetch('/api/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}


export function UserApprovalCard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const pendingUsersQuery = useMemo(() =>
    firestore ? query(collection(firestore, 'users'), where('status', '==', 'Menunggu Persetujuan')) : null
  , [firestore]);

  const { data: pendingUsers, loading, error, mutate } = useCollectionOnce<AppUser>(pendingUsersQuery);
  const { data: allUsers } = useCollectionOnce<AppUser>(firestore ? collection(firestore, 'users') : null);

  const supervisors = useMemo(() => {
    if (!allUsers) return {};
    return allUsers.reduce((acc, user) => {
      if (user.role === 'SPV') {
        acc[user.id] = user.name;
      }
      return acc;
    }, {} as Record<string, string>);
  }, [allUsers]);

  const handleApproval = async (user: AppUser, approve: boolean) => {
    if (!firestore) return;

    setLoadingStates(prev => ({ ...prev, [user.id]: true }));
    const userRef = doc(firestore, 'users', user.id);

    try {
      if (approve) {
        // Use NIK as the default password
        const defaultPassword = user.nik;
        if (!defaultPassword) {
            throw new Error("NIK tidak ditemukan dan diperlukan untuk kata sandi default.");
        }
        
        const result = await createAuthUser(user.email as string, defaultPassword);
        
        if ('error' in result) {
            // Check if user already exists in Auth
            if (result.error.includes('EMAIL_EXISTS')) {
                 toast({
                    variant: 'destructive',
                    title: 'Gagal Membuat Akun',
                    description: `Pengguna dengan email ${user.email} sudah ada di sistem autentikasi.`,
                });
                // We might want to just activate the account in this case, or flag for manual review.
                // For now, we will just show an error.
                setLoadingStates(prev => ({ ...prev, [user.id]: false }));
                return;
            }
            throw new Error(result.error);
        }
        
        const { uid } = result;

        const newUserDocRef = doc(firestore, 'users', uid);
        const batch = writeBatch(firestore);

        const userData = (await getDoc(userRef)).data();

        // Set new document with the Auth UID
        batch.set(newUserDocRef, { 
            ...userData,
            uid: uid,
            status: 'Aktif'
        });

        // Delete the old temporary document
        batch.delete(userRef);

        await batch.commit();

        toast({
          title: 'Pengguna Disetujui',
          description: `${user.name} sekarang aktif dan dapat login.`,
        });

      } else {
        await deleteDoc(userRef);
        toast({
          variant: 'destructive',
          title: 'Pengguna Ditolak',
          description: `Permintaan untuk ${user.name} telah ditolak dan dihapus.`,
        });
      }
      if (mutate) {
        mutate(); // Re-fetch the data
      }
    } catch (error: any) {
      console.error('Error handling approval:', error);
      toast({
        variant: 'destructive',
        title: 'Terjadi Kesalahan',
        description: error.message || 'Gagal memproses permintaan. Silakan coba lagi.',
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [user.id]: false }));
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Persetujuan Pengguna</CardTitle>
        <CardDescription>Pengguna baru yang ditambahkan oleh SPV menunggu persetujuan Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {loading ? (
                <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </>
            ) : error ? (
                <p className="text-sm text-destructive text-center py-4">Gagal memuat pengguna.</p>
            ) : pendingUsers && pendingUsers.length > 0 ? (
                pendingUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    Diajukan oleh: {user.supervisorId ? supervisors[user.supervisorId] || 'SPV tidak diketahui' : 'Tidak diketahui'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {loadingStates[user.id] ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8" onClick={() => handleApproval(user, false)}>
                                        <XCircle className="h-5 w-5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-500/10 hover:text-green-600 h-8 w-8" onClick={() => handleApproval(user, true)}>
                                        <CheckCircle className="h-5 w-5" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Tidak ada pengguna yang menunggu persetujuan.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
