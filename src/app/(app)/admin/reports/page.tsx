
"use client";

import { useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectReportsTable } from "@/components/admin/project-reports-table";
import type { Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
  const firestore = useFirestore();
  const projectsQuery = useMemo(
    () => (firestore ? query(collection(firestore, "projects")) : null),
    [firestore]
  );
  const { data: projects, loading } = useCollection<Project>(projectsQuery);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Reports"
          description="View all reports from every project."
        />
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Reports"
          description="View all reports from every project."
        />
        <Card>
          <CardHeader>
            <CardTitle>Consolidated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              No projects found in Firestore. Please add a project first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Project Reports"
        description="View reports filtered by project."
      />
      <Tabs defaultValue={projects[0].id} className="space-y-4">
        <TabsList>
          {projects.map((project) => (
            <TabsTrigger key={project.id} value={project.id}>
              {project.name || project.id}
            </TabsTrigger>
          ))}
        </TabsList>
        {projects.map((project) => (
          <TabsContent key={project.id} value={project.id}>
            <Card>
              <CardHeader>
                <CardTitle>Reports for {project.name || project.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectReportsTable projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
