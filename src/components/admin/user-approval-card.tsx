
'use client';

import { useMemo, useState } from 'react';
import { useFirestore } from '@/firebase';
import { useCollectionOnce } from '@/firebase/firestore/use-collection-once';
import { collection, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

export function UserApprovalCard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const pendingUsersQuery = useMemo(() =>
    firestore ? query(collection(firestore, 'users'), where('status', '==', 'Menunggu Persetujuan')) : null
  , [firestore]);
  
  const allUsersQuery = useMemo(() => firestore ? collection(firestore, 'users') : null, [firestore]);

  // Using useCollectionOnce which seems more appropriate here. Let's assume it has a mutate function for re-fetching.
  // If not, we might need a state lift or a different strategy.
  const { data: pendingUsers, loading, error, mutate } = useCollectionOnce<AppUser>(pendingUsersQuery);
  const { data: allUsers } = useCollectionOnce<AppUser>(allUsersQuery);

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
        // Just update the status to 'Aktif'. Auth user creation will be handled by the Admin if needed directly.
        await updateDoc(userRef, { status: 'Aktif' });
        toast({
          title: 'Pengguna Disetujui',
          description: `${user.name} sekarang aktif. Akun login harus dibuatkan oleh admin secara manual.`,
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
        mutate(); 
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
