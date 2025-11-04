
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Report } from "@/lib/mock-data";
import { format } from "date-fns";
import { useMemo } from "react";

export function ProjectReportsTable({ projectId }: { projectId: string }) {
    const firestore = useFirestore();
    
    const reportsCollectionRef = useMemo(() => 
        firestore ? collection(firestore, "projects", projectId, "reports") : null
    , [firestore, projectId]);
    const { data: reports, loading } = useCollection<Report>(reportsCollectionRef);

    if (loading) {
        return <div>Loading reports...</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Report ID</TableHead>
                        <TableHead>Sales Code</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {reports && reports.length > 0 ? reports.map((report) => (
                    <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.id}</TableCell>
                        <TableCell>{report.salesCode}</TableCell>
                        <TableCell>
                            {report.createdAt ? format(new Date(report.createdAt), "MMM d, yyyy, HH:mm") : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">${report.amount?.toLocaleString() || 0}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">
                            No reports found for this project.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
    );
}
