
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import type { Report, Project } from "@/lib/types";
import { useMemo } from "react";
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once";
import { formatCurrency } from "@/lib/utils";

const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

const findDateInReport = (report: Report): Date | null => {
    const dateFields = ['date', 'TANGGAL', 'Incoming Date', 'createdAt', 'created_at', 'timestamp'];
    for (const field of dateFields) {
        const value = report[field];
        if (!value) continue;

        try {
            if (value instanceof Date) return value;
            if (isFirestoreTimestamp(value)) return value.toDate();
            if (typeof value === 'string') {
                const date = parseISO(value);
                if (!isNaN(date.getTime())) return date;
            }
        } catch (e) {
            // Ignore parsing errors
        }
    }
    return null;
}


export function RecentSales({ salesCodes }: { salesCodes: string[] }) {
    const firestore = useFirestore();

    const myReportsQuery = useMemo(() => 
        firestore && salesCodes && salesCodes.length > 0
            ? query(
                collection(firestore, "reports"), 
                where("Sales Code", "in", salesCodes)
            ) : null
    , [firestore, salesCodes]);
    const { data: myReports, loading } = useCollection<Report>(myReportsQuery);

    const projectsQuery = useMemo(() => firestore ? collection(firestore, "projects") : null, [firestore]);
    const { data: projects, loading: projectsLoading } = useCollectionOnce<Project>(projectsQuery);

    const projectsMap = useMemo(() => {
      if (!projects) return new Map();
      return new Map(projects.map(p => [p.name.toLowerCase().replace(/ /g, '_'), p]));
    }, [projects]);
    
    const sortedReports = useMemo(() => {
        if (!myReports) return [];
        return [...myReports].sort((a, b) => {
            const dateA = findDateInReport(a);
            const dateB = findDateInReport(b);
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateB.getTime() - dateA.getTime();
        });
    }, [myReports]);


    const handleRowClick = (report: Report) => {
        console.log("Report clicked:", report);
    };

    if (loading || projectsLoading) {
        return <div>Memuat laporan terkini...</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">No.</TableHead>
                        <TableHead>Proyek</TableHead>
                        <TableHead>Pendapatan</TableHead>
                        <TableHead className="text-right">Tanggal</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {sortedReports && sortedReports.length > 0 ? sortedReports.slice(0, 5).map((report, index) => {
                    const project = projectsMap.get(report.projectId);
                    const fee = project?.feeSales || 0;
                    const date = findDateInReport(report);

                    return (
                        <TableRow key={report.id} onClick={() => handleRowClick(report)} className="cursor-pointer">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                                <div className="font-medium">{project?.name || report.projectId}</div>
                            </TableCell>
                            <TableCell>{formatCurrency(fee)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                                {date ? format(date, "d MMM yyyy") : "N/A"}
                            </TableCell>
                        </TableRow>
                    )
                }) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">
                            Tidak ada laporan terkini.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
    )
}
