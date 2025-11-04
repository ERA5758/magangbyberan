
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
    return <div>Loading project details...</div>;
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description={`Reports and details for ${project.name}.`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectReportsTable projectId={id as string} />
        </CardContent>
      </Card>
    </div>
  );
}
