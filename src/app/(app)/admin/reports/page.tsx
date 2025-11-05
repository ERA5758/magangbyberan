
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
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project, Report } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parse } from 'date-fns';

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
            // Handles M/d/yyyy and d/M/yyyy
            let parsedDate = parse(value, 'M/d/yyyy', new Date());
            if (!isNaN(parsedDate.getTime())) {
                return format(parsedDate, 'dd/MM/yyyy');
            }
             parsedDate = parse(value, 'd/M/yyyy', new Date());
            if (!isNaN(parsedDate.getTime())) {
                return format(parsedDate, 'dd/MM/yyyy');
            }
             // Handles ISO strings
             parsedDate = new Date(value);
             if (!isNaN(parsedDate.getTime()) && /\d/.test(value)) {
                 return format(parsedDate, 'dd/MM/yyyy');
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
    const bankName = projectId.toUpperCase().replace(/_/g, ' ');
    return query(collectionGroup(firestore, 'reports'), where('BANK', '==', bankName));
  }, [firestore, projectId]);
  
  const { data: reports, loading } = useCollectionOnce<Report>(reportsQuery);

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
                <CardDescription>
                  Displaying reports for BANK: {project.id.toUpperCase().replace(/_/g, ' ')}
                </CardDescription>
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

