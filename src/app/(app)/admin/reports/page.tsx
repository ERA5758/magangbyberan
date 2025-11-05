
"use client";

import { useMemo, useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import {
  collection,
  query,
  where,
  Timestamp,
  getDocs,
  collectionGroup,
} from "firebase/firestore";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project, Report } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parse, parseISO } from "date-fns";
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once";

const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === "function";
};

const formatValue = (value: any, key?: string): string => {
  if (value === undefined || value === null) {
    return "N/A";
  }

  if (isFirestoreTimestamp(value)) {
    try {
      return format(value.toDate(), "dd-MM-yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  }

  if (typeof value === "string") {
    try {
      // ISO format check
      if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return format(parseISO(value), "dd-MM-yyyy");
      }
      // M/d/yyyy or d/M/yyyy format check
      const dateWithSlashes = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dateWithSlashes) {
        // Try parsing M/d/yyyy first
        let d = parse(value, "M/d/yyyy", new Date());
        if (!isNaN(d.getTime())) {
          return format(d, "dd-MM-yyyy");
        }
        // Then try d/M/yyyy
        d = parse(value, "d/M/yyyy", new Date());
        if (!isNaN(d.getTime())) {
          return format(d, "dd-MM-yyyy");
        }
      }
    } catch (e) {
      // Not a date string, return original string
    }
  }

  if (typeof value === "number") {
    // Do not format MID with thousand separators
    if (key === 'MID') {
      return String(value);
    }
    return value.toLocaleString("id-ID");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
};

function FilteredReportsTable({ projectId }: { projectId: string }) {
  const firestore = useFirestore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const reportsQuery = useMemo(() => {
    if (!firestore || !projectId) return null;
    return query(
      collection(firestore, "reports"),
      where("projectId", "==", projectId)
    );
  }, [firestore, projectId]);

  const { data: fetchedReports, loading: reportsLoading } = useCollectionOnce<Report>(reportsQuery);

  useEffect(() => {
    setLoading(reportsLoading);
    if (fetchedReports) {
      setReports(fetchedReports);
    }
  }, [fetchedReports, reportsLoading]);

  const handleRowClick = (report: Report) => {
    setSelectedReport(report);
  };

  const headers = useMemo(() => {
    if (reports.length === 0) return [];
    const allHeaders = new Set<string>();
    reports.forEach((report) => {
      Object.keys(report).forEach((key) => {
        if (key !== "id" && key !== "projectId" && key !== "lastSyncTimestamp") {
          allHeaders.add(key);
        }
      });
    });
    return Array.from(allHeaders).sort();
  }, [reports]);

  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No reports found for this project.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="capitalize whitespace-nowrap">
                  {header.replace(/_/g, " ")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow
                key={report.id}
                onClick={() => handleRowClick(report)}
                className="cursor-pointer"
              >
                {headers.map((header) => (
                  <TableCell key={`${report.id}-${header}`}>
                    {formatValue(report[header], header)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedReport} onOpenChange={(isOpen) => !isOpen && setSelectedReport(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Detail</DialogTitle>
            <DialogDescription>
              Details for report ID: {selectedReport?.['ID UNIK'] || selectedReport?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-2 text-sm">
              {Object.entries(selectedReport).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-2 border-b pb-1">
                  <strong className="capitalize font-medium break-words">
                    {key.replace(/_/g, " ")}
                  </strong>
                  <span className="break-words">{formatValue(value, key)}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const formatNameToId = (name: string) => {
  return name.toLowerCase().replace(/ /g, "_");
};

export default function ReportsPage() {
  const firestore = useFirestore();
  const projectsQuery = useMemo(
    () => (firestore ? query(collection(firestore, "projects")) : null),
    [firestore]
  );
  const { data: projects, loading } = useCollectionOnce<Project>(projectsQuery);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Project Reports"
          description="View reports filtered by project."
        />
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Project Reports"
          description="View reports filtered by project."
        />
        <Card>
          <CardHeader>
            <CardTitle>No Projects Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              There are no projects in the database. Please add a project first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultTabValue = projects[0]?.name
    ? formatNameToId(projects[0].name)
    : "";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Project Reports"
        description="View reports filtered by project."
      />
      <Tabs defaultValue={defaultTabValue} className="space-y-4">
        <TabsList>
          {projects.map((project) => (
            <TabsTrigger
              key={project.id}
              value={formatNameToId(project.name)}
            >
              {project.name.toUpperCase().replace(/_/g, " ")}
            </TabsTrigger>
          ))}
        </TabsList>
        {projects.map((project) => (
          <TabsContent
            key={project.id}
            value={formatNameToId(project.name)}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  Reports for {project.name.toUpperCase().replace(/_/g, " ")}
                </CardTitle>
                <CardDescription>
                  Displaying reports for {project.name.toUpperCase().replace(/_/g, " ")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FilteredReportsTable projectId={formatNameToId(project.name)} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
