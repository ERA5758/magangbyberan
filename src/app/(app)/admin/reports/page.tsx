
"use client";

import { useMemo } from "react";
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, Timestamp } from "firebase/firestore";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Report, Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

const formatDate = (timestamp: Timestamp): string => {
    if (!isFirestoreTimestamp(timestamp)) return 'Invalid Date';
    try {
        return timestamp.toDate().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

const formatNumber = (value: any): string => {
    if (typeof value === 'number') {
        return value.toLocaleString('id-ID');
    }
    return String(value);
}

// A more robust and static table component for displaying reports
function ReportsTable({ reports, loading }: { reports: Report[] | null, loading: boolean }) {

  if (loading) {
    return (
        <div className="space-y-2 mt-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
    );
  }

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID UNIK</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Name Alias</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Referral By</TableHead>
            <TableHead>Transaksi</TableHead>
            <TableHead>Jumlah Transaksi</TableHead>
            <TableHead>Input Laporan</TableHead>
            <TableHead>Cek Digit</TableHead>
            <TableHead>Team Leader</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports && reports.length > 0 ? (
            reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report['ID UNIK'] || report.id}</TableCell>
                <TableCell>{report.Tanggal ? formatDate(report.Tanggal) : 'N/A'}</TableCell>
                <TableCell>{report.name_alias || 'N/A'}</TableCell>
                <TableCell>{report.ID || 'N/A'}</TableCell>
                <TableCell>{report['REFERRAL BY'] || 'N/A'}</TableCell>
                <TableCell>{report.TRANSAKSI || 'N/A'}</TableCell>
                <TableCell>{formatNumber(report['Jumlah Transaksi'])}</TableCell>
                <TableCell>{report['Input Laporan'] || 'N/A'}</TableCell>
                <TableCell>{report['cek digit'] || 'N/A'}</TableCell>
                <TableCell>{report['TEAM LEADER'] || 'N/A'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="text-center">
                No reports found for this project.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ProjectReportsTab({ projectId }: { projectId: string }) {
    const firestore = useFirestore();
    const reportsQuery = useMemo(() =>
        firestore ? query(collection(firestore, "projects", projectId, "reports")) : null
    , [firestore, projectId]);
    const { data: reports, loading } = useCollection<Report>(reportsQuery);

    return <ReportsTable reports={reports} loading={loading} />;
}

export default function ReportsPage() {
  const firestore = useFirestore();
  const projectsQuery = useMemo(() => 
    firestore ? query(collection(firestore, "projects")) : null
  , [firestore]);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsQuery);

  const defaultTab = useMemo(() => projects?.[0]?.id || '', [projects]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Project Reports"
        description="View reports filtered by individual projects."
      />
      <Card>
        <CardHeader>
          <CardTitle>Reports by Project</CardTitle>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <p>Loading projects...</p>
          ) : !projects || projects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            <Tabs defaultValue={defaultTab}>
              <TabsList>
                {projects.map((project) => (
                  <TabsTrigger key={project.id} value={project.id}>
                    {project.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {projects.map((project) => (
                <TabsContent key={project.id} value={project.id} className="w-full">
                  <ProjectReportsTab projectId={project.id} />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
