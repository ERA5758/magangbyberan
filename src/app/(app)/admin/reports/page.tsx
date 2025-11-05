
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
            return format(value.toDate(), 'dd-MM-yyyy');
        } catch (e) {
            return 'Invalid Date';
        }
    }

    if (typeof value === 'string') {
        // Attempt to parse string as date if it looks like one (ISO format)
        if (!isNaN(Date.parse(value))) {
            try {
                return format(parseISO(value), 'dd-MM-yyyy');
            } catch (e) {
                // Not a valid date string, return original string
            }
        }
    }

    if (typeof value === 'number') {
        return value.toLocaleString('id-ID');
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return '[Object]';
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
    // Aggregate all possible keys from all report documents
    const headerSet = new Set<string>();
    reports.forEach(report => {
      Object.keys(report).forEach(key => {
        // Exclude internal fields from headers
        if(key !== 'id' && key !== 'lastSyncTimestamp') { 
            headerSet.add(key);
        }
      });
    });
    
    // Sort headers alphabetically for consistent order
    return Array.from(headerSet).sort((a, b) => a.localeCompare(b));

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
                <TableHead key={header} className="capitalize whitespace-nowrap">{header.replace(/_/g, ' ')}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports && reports.length > 0 ? (
            reports.map((report) => (
              <TableRow key={report.id}>
                {headers.map(header => (
                    <TableCell key={`${report.id}-${header}`}>
                        {formatValue(report[header])}
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
