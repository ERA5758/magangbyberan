
"use client";

import { useMemo, useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import {
  collection,
  query,
  where,
  Timestamp,
  limit,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
  startAfter,
  orderBy,
  endBefore,
  limitToLast,
} from "firebase/firestore";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Button } from "@/components/ui/button";
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
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return format(parseISO(value), "dd-MM-yyyy");
      }
      const dateWithSlashes = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dateWithSlashes) {
        let d = parse(value, "M/d/yyyy", new Date());
        if (!isNaN(d.getTime())) {
          return format(d, "dd-MM-yyyy");
        }
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
    if (key === "MID") {
      return String(value);
    }
    return value.toLocaleString("id-ID");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
};

const PAGE_SIZE = 50;

function FilteredReportsTable({ projectId }: { projectId: string }) {
  const firestore = useFirestore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);

  useEffect(() => {
    // Reset state when projectId changes
    setReports([]);
    setLoading(true);
    setLastVisible(null);
    setFirstVisible(null);
    setPage(1);
    setIsLastPage(false);
    fetchReports(projectId, "next");
  }, [projectId]);

  const fetchReports = async (
    currentProjectId: string,
    direction: "next" | "prev"
  ) => {
    if (!firestore) return;
    setLoading(true);

    try {
      let reportsQuery;
      const baseQuery = query(
        collection(firestore, "reports"),
        where("projectId", "==", currentProjectId)
      );

      if (direction === "next" && lastVisible) {
        reportsQuery = query(baseQuery, startAfter(lastVisible), limit(PAGE_SIZE));
      } else if (direction === "prev" && firstVisible) {
        reportsQuery = query(baseQuery, endBefore(firstVisible), limitToLast(PAGE_SIZE));
      } else {
        reportsQuery = query(baseQuery, limit(PAGE_SIZE));
      }

      const documentSnapshots = await getDocs(reportsQuery);
      const newReports = documentSnapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Report[];

      setReports(newReports);

      if (documentSnapshots.docs.length > 0) {
        setFirstVisible(documentSnapshots.docs[0]);
        setLastVisible(
          documentSnapshots.docs[documentSnapshots.docs.length - 1]
        );
      }
      
      // Check if it's the last page
      if (documentSnapshots.docs.length < PAGE_SIZE) {
        setIsLastPage(true);
      } else {
        setIsLastPage(false);
      }

    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (!isLastPage) {
      setPage(page + 1);
      fetchReports(projectId, "next");
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      fetchReports(projectId, "prev");
    }
  };

  const handleRowClick = (report: Report) => {
    setSelectedReport(report);
  };

  const headers = useMemo(() => {
    if (reports.length === 0) return [];
    const allHeaders = new Set<string>();
    reports.forEach((report) => {
      Object.keys(report).forEach((key) => {
        if (
          key !== "id" &&
          key !== "projectId" &&
          key !== "lastSyncTimestamp"
        ) {
          allHeaders.add(key);
        }
      });
    });
    return Array.from(allHeaders).sort();
  }, [reports]);

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-2 mt-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!loading && reports.length === 0) {
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
            {loading ? (
                <TableRow>
                    <TableCell colSpan={headers.length} className="h-24 text-center">
                        Loading...
                    </TableCell>
                </TableRow>
            ) : (
                reports.map((report) => (
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
                ))
            )}
          </TableBody>
        </Table>
      </div>

       <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={isLastPage || loading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>


      <Dialog
        open={!!selectedReport}
        onOpenChange={(isOpen) => !isOpen && setSelectedReport(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Detail</DialogTitle>
            <DialogDescription>
              Details for report ID:{" "}
              {selectedReport?.["ID UNIK"] || selectedReport?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-2 text-sm">
              {Object.entries(selectedReport).map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-2 gap-2 border-b pb-1"
                >
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

  const [activeTab, setActiveTab] = useState<string | undefined>();

  useEffect(() => {
    if (projects && projects.length > 0 && !activeTab) {
      setActiveTab(formatNameToId(projects[0].name));
    }
  }, [projects, activeTab]);

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Project Reports"
        description="View reports filtered by project."
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          {projects.map((project) => (
            <TabsTrigger key={project.id} value={formatNameToId(project.name)}>
              {project.name.toUpperCase().replace(/_/g, " ")}
            </TabsTrigger>
          ))}
        </TabsList>
        {projects.map((project) => (
          <TabsContent
            key={project.id}
            value={formatNameToId(project.name)}
            forceMount
            className={activeTab === formatNameToId(project.name) ? '' : 'hidden'}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  Reports for {project.name.toUpperCase().replace(/_/g, " ")}
                </CardTitle>
                <CardDescription>
                  Displaying reports for{" "}
                  {project.name.toUpperCase().replace(/_/g, " ")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FilteredReportsTable
                  projectId={formatNameToId(project.name)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

    