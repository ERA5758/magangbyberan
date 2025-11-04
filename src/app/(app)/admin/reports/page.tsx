
"use client";

import { useMemo } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { collectionGroup, query } from "firebase/firestore";
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
import type { Report } from "@/lib/mock-data";
import { format } from "date-fns";

function AllReportsTable() {
  const firestore = useFirestore();
  
  const reportsQuery = useMemo(() => 
      firestore ? query(collectionGroup(firestore, "reports")) : null
  , [firestore]);

  const { data: reports, loading } = useCollection<Report>(reportsQuery);

  if (loading) {
    return <div>Loading all reports...</div>;
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
          {reports && reports.length > 0 ? (
            reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.id}</TableCell>
                <TableCell>{report.salesCode}</TableCell>
                <TableCell>
                  {report.createdAt
                    ? format(new Date(report.createdAt), "MMM d, yyyy, HH:mm")
                    : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  ${report.amount?.toLocaleString() || 0}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
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
