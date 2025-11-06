
'use client';

import { useMemo, useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useCollectionOnce } from '@/firebase/firestore/use-collection-once';
import type { Project } from '@/lib/types';
import { callAppsScriptEndpoint } from '@/lib/appscript';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

function SyncItem({ project, onSyncComplete }: { project: Project, onSyncComplete: () => void }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    if (!auth || !project.appsScriptUrl || !firestore) return;

    setIsSyncing(true);
    toast({
      title: `Memulai Sinkronisasi untuk ${project.name}...`,
      description: "Menghubungi Google Apps Script...",
    });

    try {
      const result = await callAppsScriptEndpoint(auth, project.appsScriptUrl, { action: "sync_data" });
      
      const projectRef = doc(firestore, 'projects', project.id);
      await updateDoc(projectRef, {
          lastSyncTime: serverTimestamp(),
          lastSyncStatus: result.status,
          lastSyncMessage: result.message
      });
      
      toast({
        title: "Sinkronisasi Berhasil",
        description: `Proyek ${project.name}: ${result.message || 'Proses selesai.'}`,
      });
      onSyncComplete(); // Trigger re-fetch
    } catch (error: any) {
       const projectRef = doc(firestore, 'projects', project.id);
       await updateDoc(projectRef, {
          lastSyncTime: serverTimestamp(),
          lastSyncStatus: 'error',
          lastSyncMessage: error.message || "Terjadi kesalahan yang tidak diketahui."
      });

      console.error(`Gagal sinkronisasi untuk ${project.name}:`, error);
      toast({
        variant: "destructive",
        title: `Gagal Sinkronisasi ${project.name}`,
        description: error.message || "Terjadi kesalahan saat menghubungi Apps Script.",
      });
       onSyncComplete(); // Trigger re-fetch even on error
    } finally {
      setIsSyncing(false);
    }
  };

  const lastSyncTime = project.lastSyncTime as Timestamp | undefined;

  return (
    <div className="flex flex-col gap-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{project.name}</p>
        <Button
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Sinkronkan
        </Button>
      </div>
      {lastSyncTime && (
        <div className="text-xs text-muted-foreground border-t border-muted pt-2 space-y-1">
          <p>
            Sinkronisasi Terakhir: {formatDistanceToNow(lastSyncTime.toDate(), { addSuffix: true, locale: id })}
          </p>
          <div className="flex items-center gap-1.5">
            {project.lastSyncStatus === 'success' ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-destructive" />}
            <p className="italic">
              Hasil: {project.lastSyncMessage || 'Tidak ada pesan.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectSyncCard() {
  const firestore = useFirestore();

  const projectsQuery = useMemo(() => 
    firestore 
      ? query(
          collection(firestore, 'projects'), 
          where('status', '==', 'Aktif')
        ) 
      : null, 
    [firestore]
  );
  // Renamed mutate to avoid conflicts
  const { data: activeProjects, loading, mutate: refetchProjects } = useCollectionOnce<Project>(projectsQuery);

  const projectsWithUrl = useMemo(() => {
    if (!activeProjects) return [];
    return activeProjects.filter(p => p.appsScriptUrl && p.appsScriptUrl.trim() !== '');
  }, [activeProjects]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sinkronisasi Apps Script</CardTitle>
        <CardDescription>Jalankan sinkronisasi data dari Google Apps Script untuk setiap proyek.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : projectsWithUrl && projectsWithUrl.length > 0 ? (
            projectsWithUrl.map(project => (
              <SyncItem key={project.id} project={project} onSyncComplete={refetchProjects} />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8 flex flex-col items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm">Tidak ada proyek aktif dengan URL Apps Script yang dikonfigurasi.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
