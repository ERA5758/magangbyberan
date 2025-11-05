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
import { useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once";
import { collection, doc, Timestamp, query } from "firebase/firestore";
import type { Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

const formatDate = (date: Date): string => {
    try {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    } catch (e) {
        return 'Invalid Date';
    }
};

const formatValue = (value: any): string => {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    if (isFirestoreTimestamp(value)) {
        return formatDate(value.toDate());
    }
    if (typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        try {
            const parts = value.split('/');
            const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            return formatDate(date);
        } catch (e) {
            return value;
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

export function ProjectReportsTable({ projectId }: { projectId: string }) {
    const firestore = useFirestore();
    
    const projectRef = useMemo(() => 
        firestore ? doc(firestore, "projects", projectId) : null
    , [firestore, projectId]);
    const { data: project, loading: projectLoading } = useDoc<Project>(projectRef);

    const reportsQuery = useMemo(() => {
        if (!firestore) return null;
        const reportsCollectionRef = collection(firestore, "projects", projectId, "reports");
        return query(reportsCollectionRef); 
    }, [firestore, projectId]);
    
    const { data: reports, loading: reportsLoading } = useCollectionOnce<{[key: string]: any}>(reportsQuery);

    const headers = useMemo(() => {
        if (project?.reportHeaders && project.reportHeaders.length > 0) {
            return project.reportHeaders;
        }
        if(reports && reports.length > 0) {
            const dynamicHeaders = new Set<string>();
            reports.forEach(report => {
                Object.keys(report).forEach(key => {
                    if(key !== 'id' && key !== 'lastSyncTimestamp') { 
                        dynamicHeaders.add(key);
                    }
                });
            });
            return Array.from(dynamicHeaders).sort();
        }
        return [];
    }, [project, reports]);

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
         return <p className="text-center text-muted-foreground py-8">No report headers configured for this project. Please set them on the Projects page.</p>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map(header => (
                            <TableHead key={header} className="capitalize">{header.replace(/_/g, ' ')}</TableHead>
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
                        <TableCell colSpan={headers.length} className="text-center h-24">
                            No reports found for this project.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
    );
}
