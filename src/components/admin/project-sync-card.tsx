
'use client';

import { useMemo, useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollectionOnce } from '@/firebase/firestore/use-collection-once';
import type { Project } from '@/lib/types';
import { callAppsScriptEndpoint } from '@/lib/appscript';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

function SyncItem({ project }: { project: Project }) {
  const auth = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    if (!auth || !project.appsScriptUrl) return;

    setIsSyncing(true);
    toast({
      title: `Memulai Sinkronisasi untuk ${project.name}...`,
      description: "Menghubungi Google Apps Script...",
    });

    try {
      const result = await callAppsScriptEndpoint(auth, project.appsScriptUrl, { action: "sync_data" });
      toast({
        title: "Sinkronisasi Berhasil",
        description: `Proyek ${project.name}: ${result.message || 'Proses selesai.'}`,
      });
    } catch (error: any) {
      console.error(`Gagal sinkronisasi untuk ${project.name}:`, error);
      toast({
        variant: "destructive",
        title: `Gagal Sinkronisasi ${project.name}`,
        description: error.message || "Terjadi kesalahan saat menghubungi Apps Script.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
  );
}

export function ProjectSyncCard() {
  const firestore = useFirestore();

  const projectsQuery = useMemo(() => 
    firestore 
      ? query(
          collection(firestore, 'projects'), 
          where('status', '==', 'Aktif'), 
          where('appsScriptUrl', '!=', '')
        ) 
      : null, 
    [firestore]
  );
  const { data: projects, loading } = useCollectionOnce<Project>(projectsQuery);

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
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : projects && projects.length > 0 ? (
            projects.map(project => (
              <SyncItem key={project.id} project={project} />
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
