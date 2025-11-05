
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFirestore } from "@/firebase";
import { collection, doc, getDoc, getDocs, Timestamp, query } from "firebase/firestore";
import type { Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

// Simplified for debugging: Just convert value to string.
const formatValue = (value: any): string => {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    if (isFirestoreTimestamp(value)) {
        // Temporarily just show it's a timestamp object
        return value.toDate().toISOString(); 
    }
    // Convert everything else to a simple string
    return String(value);
};

export function ProjectReportsTable({ projectId }: { projectId: string }) {
    const firestore = useFirestore();
    const [project, setProject] = useState<Project | null>(null);
    const [reports, setReports] = useState<{[key: string]: any}[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!firestore || !projectId) {
            setLoading(false);
            return;
        };

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch project document to get headers
                const projectRef = doc(firestore, "projects", projectId);
                const projectSnap = await getDoc(projectRef);

                let projectData: Project | null = null;
                if (projectSnap.exists()) {
                    projectData = { id: projectSnap.id, ...projectSnap.data() } as Project;
                    setProject(projectData);
                } else {
                    setProject(null);
                    setReports([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch reports subcollection
                const reportsRef = collection(firestore, "projects", projectId, "reports");
                const reportsQuery = query(reportsRef);
                const reportsSnap = await getDocs(reportsQuery);
                
                const reportsData = reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setReports(reportsData);

            } catch (error) {
                console.error("Error fetching project data:", error);
                setProject(null);
                setReports([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [firestore, projectId]);

    const headers = project?.reportHeaders && project.reportHeaders.length > 0 ? project.reportHeaders : [];

    if (loading) {
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
