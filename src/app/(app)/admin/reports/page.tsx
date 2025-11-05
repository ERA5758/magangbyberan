
"use client";

import { useMemo } from "react";
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query } from "firebase/firestore";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectReportsTable } from "@/components/admin/project-reports-table";

export default function ReportsPage() {
  const firestore = useFirestore();
  const projectsQuery = useMemo(() => 
    firestore ? query(collection(firestore, "projects")) : null
  , [firestore]);

  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsQuery);

  if (projectsLoading) {
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
            <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-40 w-full" />
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
                title="Project Reports"
                description="View reports filtered by individual projects."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Reports by Project</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        No projects found. Add projects in the 'Projects' page to see reports here.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
  }

  const defaultTab = projects[0]?.id;

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
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList>
                {projects.map((project) => (
                  <TabsTrigger key={project.id} value={project.id}>
                    {project.name || project.id}
                  </TabsTrigger>
                ))}
              </TabsList>

              {projects.map((project) => (
                <TabsContent key={project.id} value={project.id} className="w-full pt-4">
                  <ProjectReportsTable projectId={project.id} />
                </TabsContent>
              ))}
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

