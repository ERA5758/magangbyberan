
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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
  doc,
  getDoc,
  getCountFromServer,
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
      return "Tanggal Tidak Valid";
    }
  }

  if (typeof value === "string") {
    try {
      if (/\d{4}-\d{2}-\d{2}T\d{2}/.test(value)) {
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
    return value ? "Ya" : "Tidak";
  }

  return String(value);
};

const PAGE_SIZE = 50;

function FilteredReportsTable({ project }: { project: Project }) {
  const firestore = useFirestore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const isMountedRef = useRef(true);
  
  const projectId = project.name.toLowerCase().replace(/ /g, "_");

  useEffect(() => {
    isMountedRef.current = true;
    if (!firestore) return;

    const fetchCount = async () => {
      const countQuery = query(collection(firestore, "reports"), where("projectId", "==", projectId));
      const snapshot = await getCountFromServer(countQuery);
      if (isMountedRef.current) {
        setTotalCount(snapshot.data().count);
      }
    }
    fetchCount();

    return () => {
      isMountedRef.current = false;
    }
  }, [project, firestore, projectId]);


  const fetchReports = async (
    direction: "next" | "prev" | "first"
  ) => {
    if (!firestore) return;
    if (isMountedRef.current) setLoading(true);

    try {
      const queryConstraints = [
        where("projectId", "==", projectId),
      ];

      let reportsQuery;
      const baseQuery = query(
        collection(firestore, "reports"),
        ...queryConstraints,
        orderBy("__name__")
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
      
      if (isMountedRef.current) {
        if (documentSnapshots.docs.length > 0) {
          setReports(newReports);
          setFirstVisible(documentSnapshots.docs[0]);
          setLastVisible(
            documentSnapshots.docs[documentSnapshots.docs.length - 1]
          );
        } else {
          if (direction === 'first') {
            setReports([]);
          }
          if(direction !== 'first') {
            setPage(page);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      if (isMountedRef.current) {
        setReports([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };
  
  useEffect(() => {
    isMountedRef.current = true;
    setReports([]);
    setLoading(true);
    setLastVisible(null);
    setFirstVisible(null);
    setPage(1);
    fetchReports("first");
    
    return () => {
      isMountedRef.current = false;
    };
  }, [project, firestore]);
  
  const handleNextPage = () => {
    if (lastVisible) {
      setPage(page + 1);
      fetchReports("next");
    }
  };

  const handlePrevPage = () => {
    if (firstVisible && page > 1) {
      setPage(page - 1);
      fetchReports("prev");
    }
  };

  const handleRowClick = (report: Report) => {
    setSelectedReport(report);
  };
  
  const headers = project.reportHeaders && project.reportHeaders.length > 0 
    ? project.reportHeaders 
    : [];

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-2 mt-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }
  
  return (
    <>
      {(!loading && reports.length === 0) ? (
         <p className="text-center text-muted-foreground py-8">
            Tidak ada laporan yang ditemukan untuk kriteria yang dipilih.
        </p>
      ) : !project.reportHeaders || project.reportHeaders.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
            Header laporan belum dikonfigurasi untuk proyek ini. Harap konfigurasikan di pengaturan proyek.
        </p>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No.</TableHead>
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
                        <TableCell colSpan={headers.length + 1} className="h-24 text-center">
                            Memuat...
                        </TableCell>
                    </TableRow>
                ) : (
                    reports.map((report, index) => (
                      <TableRow
                        key={report.id}
                        onClick={() => handleRowClick(report)}
                        className="cursor-pointer"
                      >
                        <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                        {headers.map((header) => (
                          <TableCell key={`${report.id}-${header}`}>
                            {formatValue(report[header] ?? report[header.replace(/ /g, '_')], header)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-4 py-4">
              <span className="text-sm text-muted-foreground">
                Halaman {page} dari {Math.ceil(totalCount / PAGE_SIZE)} (Total: {totalCount.toLocaleString()} laporan)
              </span>
              <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={page === 1 || loading}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Sebelumnya
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={reports.length < PAGE_SIZE || loading}
                >
                    Berikutnya
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
        </>
      )}


      <Dialog
        open={!!selectedReport}
        onOpenChange={(isOpen) => !isOpen && setSelectedReport(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Laporan</DialogTitle>
            <DialogDescription>
              Detail untuk laporan ID:{" "}
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
    () => (firestore ? query(collection(firestore, "projects"), where("status", "==", "Aktif")) : null),
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
          title="Laporan Proyek"
          description="Lihat laporan yang difilter berdasarkan proyek."
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
          title="Laporan Proyek"
          description="Lihat laporan yang difilter berdasarkan proyek."
        />
        <Card>
          <CardHeader>
            <CardTitle>Tidak Ada Proyek Aktif Ditemukan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Tidak ada proyek aktif untuk menampilkan laporan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Laporan Proyek"
        description="Lihat laporan yang difilter berdasarkan proyek."
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
                  Laporan untuk {project.name.toUpperCase().replace(/_/g, " ")}
                </CardTitle>
                <CardDescription>
                  Menampilkan laporan untuk {project.name.toUpperCase().replace(/_/g, " ")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FilteredReportsTable
                  project={project}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
