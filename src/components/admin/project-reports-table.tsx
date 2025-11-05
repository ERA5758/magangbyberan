
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
import { collection, doc, getDoc, getDocs, Timestamp, query, where } from "firebase/firestore";
import type { Project, Report } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from 'date-fns';

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
            if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                return format(parseISO(value), 'dd/MM/yyyy');
            }
            const dateWithSlashes = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (dateWithSlashes) {
                // Attempt to parse M/d/yyyy or d/M/yyyy
                const d = new Date(value);
                if (!isNaN(d.getTime())) {
                    return format(d, 'dd/MM/yyyy');
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

export function ProjectReportsTable({ projectId }: { projectId: string }) {
    const firestore = useFirestore();
    const [project, setProject] = useState<Project | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!firestore || !projectId) {
            setLoading(false);
            return;
        };

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch project to get headers
                const projectRef = doc(firestore, "projects", projectId);
                const projectSnap = await getDoc(projectRef);

                let fetchedProject: Project | null = null;
                if (projectSnap.exists()) {
                    fetchedProject = { id: projectSnap.id, ...projectSnap.data() } as Project;
                    setProject(fetchedProject);
                } else {
                    // If project doesn't exist, we can't fetch reports for it.
                    setProject(null);
                    setReports([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch reports for that project
                const reportsQuery = query(
                  collection(firestore, "reports"),
                  where("projectId", "==", fetchedProject.name.toLowerCase().replace(/ /g, "_"))
                );
                const reportsSnap = await getDocs(reportsQuery);
                const reportsData = reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Report[];
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

    const handleRowClick = (report: Report) => {
        console.log("Report clicked:", report);
    };

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

    if (reports.length === 0) {
         return <p className="text-center text-muted-foreground py-8">No reports found for this project.</p>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">No.</TableHead>
                        {headers.map(header => (
                            <TableHead key={header} className="capitalize whitespace-nowrap">{header.replace(/_/g, ' ')}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                {reports.map((report, index) => (
                    <TableRow key={report.id} onClick={() => handleRowClick(report)} className="cursor-pointer">
                        <TableCell>{index + 1}</TableCell>
                        {headers.map(header => (
                            <TableCell key={`${report.id}-${header}`}>
                                {formatValue(report[header])}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
    );
}
