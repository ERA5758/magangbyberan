
"use client";

import { useMemo } from "react";
import { useFirestore } from "@/firebase";
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once";
import { collectionGroup, query, Timestamp } from "firebase/firestore";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Report } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

const formatValue = (value: any): string => {
    if (isFirestoreTimestamp(value)) {
        try {
            return value.toDate().toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    }
    if (typeof value === 'number') {
        return value.toLocaleString('id-ID');
    }
    if (typeof value === 'object' && value !== null) {
        // Avoid showing complex objects like lastSyncTimestamp
        return '[object]';
    }
    return String(value);
};


function AllReportsTable() {
  const firestore = useFirestore();
  
  const reportsQuery = useMemo(() => 
      firestore ? query(collectionGroup(firestore, "reports")) : null
  , [firestore]);

  const { data: reports, loading } = useCollectionOnce<Report>(reportsQuery);

  const headers = useMemo(() => {
    if (!reports || reports.length === 0) {
      return [];
    }
    const headerSet = new Set<string>();
    reports.forEach(report => {
      Object.keys(report).forEach(key => {
        // Exclude firestore document id and internal fields from headers
        if(key !== 'id' && key !== 'lastSyncTimestamp') { 
            headerSet.add(key);
        }
      });
    });
    
    // Define a preferred order
    const preferredOrder = [
        'ID UNIK', 'Tanggal', 'name_alias', 'ID', 'REFERRAL BY', 
        'TRANSAKSI', 'Jumlah Transaksi', 'Input Laporan', 'cek digit', 'TEAM LEADER'
    ];

    return Array.from(headerSet).sort((a, b) => {
        const indexA = preferredOrder.indexOf(a);
        const indexB = preferredOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
  }, [reports]);

  if (loading) {
    return (
        <div className="space-y-2">
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
            {headers.map((header) => (
                <TableHead key={header} className="capitalize">{header.replace(/_/g, ' ')}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports && reports.length > 0 ? (
            reports.map((report) => (
              <TableRow key={report.id}>
                {headers.map(header => (
                    <TableCell key={`${report.id}-${header}`}>
                        {formatValue(report[header as keyof Report])}
                    </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length || 1} className="text-center">
                No reports found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}


export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="All Reports"
        description="View all reports from every project."
      />
      <Card>
        <CardHeader>
          <CardTitle>Consolidated Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <AllReportsTable />
        </CardContent>
      </Card>
    </div>
  );
}
