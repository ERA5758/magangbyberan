
"use client";
import { ProjectsTable } from "@/components/admin/projects-table";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Proyek"
        description="Kelola semua proyek perusahaan."
      />
      <Card>
        <CardHeader>
          <CardTitle>Semua Proyek</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectsTable />
        </CardContent>
      </Card>
    </div>
  );
}
