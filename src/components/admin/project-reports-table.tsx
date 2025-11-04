
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
                        <TableHead>ID UNIK</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Name Alias</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Referral By</TableHead>
                        <TableHead>Transaksi</TableHead>
                        <TableHead>Jumlah Transaksi</TableHead>
                        <TableHead>Input Laporan</TableHead>
                        <TableHead>Cek Digit</TableHead>
                        <TableHead>Team Leader</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {reports && reports.length > 0 ? reports.map((report) => (
                    <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.id}</TableCell>
                        <TableCell>
                            {report.createdAt ? format(new Date(report.createdAt), "dd-MM-yyyy") : 'N/A'}
                        </TableCell>
                        <TableCell>{report.name_alias}</TableCell>
                        <TableCell>{report.customId}</TableCell>
                        <TableCell>{report.referral_by}</TableCell>
                        <TableCell>{report.transaksi}</TableCell>
                        <TableCell className="text-right">
                          {typeof report.jumlah_transaksi === 'number' ? report.jumlah_transaksi.toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell>{report.input_laporan}</TableCell>
                        <TableCell>{report.cek_digit}</TableCell>
                        <TableCell>{report.team_leader}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={10} className="text-center">
                            No reports found for this project.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
    );
}
