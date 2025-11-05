
'use client';

import { useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useCollectionOnce } from '@/firebase/firestore/use-collection-once';
import type { Project, Report } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { FileText, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProjectSalesSummary() {
  const firestore = useFirestore();
  const router = useRouter();

  const projectsQuery = useMemo(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const reportsQuery = useMemo(() => firestore ? collection(firestore, 'reports') : null, [firestore]);

  const { data: projects, loading: projectsLoading } = useCollectionOnce<Project>(projectsQuery);
  const { data: reports, loading: reportsLoading } = useCollectionOnce<Report>(reportsQuery);

  const isLoading = projectsLoading || reportsLoading;

  const salesByProject = useMemo(() => {
    if (!projects || !reports) return [];

    return projects.map(project => {
      const projectIdentifier = project.name.toLowerCase().replace(/ /g, '_');
      const projectSalesCount = reports.filter(report => report.projectId === projectIdentifier).length;
      return {
        ...project,
        salesCount: projectSalesCount,
      };
    }).sort((a, b) => b.salesCount - a.salesCount);
  }, [projects, reports]);

  const handleProjectClick = (projectId: string) => {
    router.push(`/admin/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (salesByProject.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-4">Belum ada data penjualan proyek.</p>;
  }

  return (
    <div className="space-y-3">
      {salesByProject.map(project => (
        <div
          key={project.id}
          onClick={() => handleProjectClick(project.id)}
          className="flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-md">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">{project.name}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{project.salesCount.toLocaleString()}</span> laporan penjualan tercatat
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}
