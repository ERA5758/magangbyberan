
"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection, useDoc, useFirestore } from "@/firebase";
import { collection, doc, Timestamp } from "firebase/firestore";
import type { Report, Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

const formatDate = (date: Date): string => {
    try {
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

const formatValue = (value: any): string => {
    if (isFirestoreTimestamp(value)) {
        return formatDate(value.toDate());
    }
    // Attempt to parse string dates like "9/15/2025"
    if (typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        try {
            const date = new Date(value);
            return formatDate(date);
        } catch (e) {
            // Not a valid date string, return as is
            return value;
        }
    }
    if (typeof value === 'number') {
        return value.toLocaleString('id-ID');
    }
    if (value === undefined || value === null) {
      return 'N/A';
    }
    return String(value);
}

export function ProjectReportsTable({ projectId }: { projectId: string }) {
    const firestore = useFirestore();
    
    // 1. Fetch the project document to get reportHeaders
    const projectRef = useMemo(() => 
        firestore ? doc(firestore, "projects", projectId) : null
    , [firestore, projectId]);
    const { data: project, loading: projectLoading } = useDoc<Project>(projectRef);

    // 2. Fetch the reports sub-collection
    const reportsCollectionRef = useMemo(() => 
        firestore ? collection(firestore, "projects", projectId, "reports") : null
    , [firestore, projectId]);
    const { data: reports, loading: reportsLoading } = useCollection<Report>(reportsCollectionRef);

    const headers = useMemo(() => {
        if (project?.reportHeaders && project.reportHeaders.length > 0) {
            return project.reportHeaders;
        }
        return [];
    }, [project]);

    const isLoading = projectLoading || reportsLoading;

    if (isLoading) {
        return (
            <div className="space-y-2 mt-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        );
    }

    if (!project) {
        return <p className="text-center text-muted-foreground py-8">Project configuration not found.</p>;
    }
    
    if (headers.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No report headers configured for this project. Please set them in the 'Projects' page.</p>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map(header => (
                            <TableHead key={header}>{header}</TableHead>
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
                        <TableCell colSpan={headers.length} className="text-center">
                            No reports found for this project.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
    );
}
