
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectReportsTable } from '@/components/admin/project-reports-table';
import type { Project } from '@/lib/types';
import { useMemo } from 'react';

export default function ProjectDetailPage() {
  const params = useParams();
  const { id } = params;
  const firestore = useFirestore();

  const projectRef = useMemo(() => firestore && id ? doc(firestore, 'projects', id as string) : null, [firestore, id]);
  const { data: project, loading } = useDoc<Project>(projectRef);

  if (loading) {
    return <div>Memuat detail proyek...</div>;
  }

  if (!project) {
    return <div>Proyek tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description={`Laporan dan detail untuk ${project.name}.`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectReportsTable projectId={id as string} />
        </CardContent>
      </Card>
    </div>
  );
}
