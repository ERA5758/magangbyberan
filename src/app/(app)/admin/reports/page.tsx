
"use client";

import { useMemo, useState } from "react";
import { useFirestore } from "@/firebase";
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once";
import { collection, collectionGroup, query, where, Timestamp } from "firebase/firestore";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

const formatValue = (value: any): string => {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    
    if (isFirestoreTimestamp(value)) {
        try {
            return format(value.toDate(), 'dd/MM/yyyy');
        } catch (e) {
            return 'Invalid Date';
        }
    }

    if (typeof value === 'string') {
        try {
            const parsedDate1 = Date.parse(value);
            if (!isNaN(parsedDate1)) {
                 const dateObj = new Date(parsedDate1);
                 // Check if it's a valid date object before formatting
                 if (!isNaN(dateObj.getTime())) {
                    return format(dateObj, 'dd/MM/yyyy');
                 }
            }
        } catch (e) {
            // Not a date string, return original string
        }
    }

    if (typeof value === 'number') {
        return value.toLocaleString('id-ID');
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    
    return String(value);
};

function FilteredReportsTable({ projectId }: { projectId: string }) {
  const firestore = useFirestore();

  const reportsQuery = useMemo(() => {
    if (!firestore || !projectId) return null;
    // This is the key: Use collectionGroup and filter by a field that identifies the project.
    // Based on the data structure, filtering by the "BANK" field is the correct approach.
    return query(collectionGroup(firestore, 'reports'), where('BANK', '==', projectId.toUpperCase()));
  }, [firestore, projectId]);
  
  const { data: reports, loading } = useCollectionOnce<{[key: string]: any}>(reportsQuery);

  const headers = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    const headerSet = new Set<string>();
    reports.forEach(report => {
      Object.keys(report).forEach(key => {
        if (key !== 'id' && key !== 'lastSyncTimestamp') {
          headerSet.add(key);
        }
      });
    });
    const sortedHeaders = Array.from(headerSet).sort();
    
    // Ensure "BANK" and "ID UNIK" are first if they exist
    const preferredOrder = ["ID UNIK", "BANK"];
    return [...preferredOrder.filter(h => sortedHeaders.includes(h)), ...sortedHeaders.filter(h => !preferredOrder.includes(h))];

  }, [reports]);

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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map(header => (
              <TableHead key={header} className="capitalize whitespace-nowrap">{header.replace(/_/g, ' ')}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports && reports.length > 0 ? reports.map((report) => (
            <TableRow key={report.id}>
              {headers.map(header => (
                <TableCell key={`${report.id}-${header}`}>
                  {formatValue(report[header])}
                </TableCell>
              ))}
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={headers.length || 1} className="text-center h-24">
                No reports found for this project.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ReportsPage() {
  const firestore = useFirestore();
  const projectsQuery = useMemo(
    () => (firestore ? query(collection(firestore, "projects")) : null),
    [firestore]
  );
  const { data: projects, loading } = useCollectionOnce<Project>(projectsQuery);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Project Reports"
          description="View reports filtered by project."
        />
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Project Reports"
          description="View reports filtered by project."
        />
        <Card>
          <CardHeader>
            <CardTitle>No Projects Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              There are no projects in the database. Please add a project first from the Admin > Projects page.
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
                <FilteredReportsTable projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
