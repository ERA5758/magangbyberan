
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useAuth, useFirestore } from "@/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project, Report, AppUser } from "@/lib/types";
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
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import AppLogo from "@/components/shared/app-logo";

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

function FilteredReportsTable({ project, teamMembers, selectedSalesId, searchQuery }: { project: Project, teamMembers: AppUser[], selectedSalesId?: string, searchQuery: string }) {
  const firestore = useFirestore();
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
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

  const projectRelevantSalesCodes = useMemo(() => {
    if (selectedSalesId) {
      const selectedMember = teamMembers.find(m => m.id === selectedSalesId);
      return selectedMember?.projectAssignments?.map(pa => pa.salesCode).filter(Boolean) as string[] || [];
    }
    return teamMembers.flatMap(m => m.projectAssignments?.map(pa => pa.salesCode)).filter(Boolean) as string[];
  }, [teamMembers, selectedSalesId]);


  useEffect(() => {
    isMountedRef.current = true;
    if (!firestore || projectRelevantSalesCodes.length === 0) {
      if (isMountedRef.current) {
        setTotalCount(0);
      }
      return;
    };

    const fetchCount = async () => {
      const countQuery = query(collection(firestore, "reports"), 
        where("projectId", "==", projectId), 
        where("Sales Code", "in", projectRelevantSalesCodes)
      );
      const snapshot = await getCountFromServer(countQuery);
      if (isMountedRef.current) {
        setTotalCount(snapshot.data().count);
      }
    }
    fetchCount();

    return () => {
      isMountedRef.current = false;
    }
  }, [project, firestore, projectId, projectRelevantSalesCodes]);


  const fetchReports = async (
    direction: "next" | "prev" | "first"
  ) => {
    if (!firestore || projectRelevantSalesCodes.length === 0) {
        if (isMountedRef.current) {
            setAllReports([]);
            setLoading(false);
        }
        return;
    };
    if (isMountedRef.current) setLoading(true);

    try {
      // NOTE: The user has specified that the sales code field is *always* "Sales Code".
      const queryConstraints = [
        where("projectId", "==", projectId),
        where("Sales Code", "in", projectRelevantSalesCodes)
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
          setAllReports(newReports);
          setFirstVisible(documentSnapshots.docs[0]);
          setLastVisible(
            documentSnapshots.docs[documentSnapshots.docs.length - 1]
          );
        } else {
          if (direction === 'first') {
            setAllReports([]);
          }
          if(direction !== 'first') {
            // If we are on a page and there are no more results (e.g. page 2 had 1 item, now it has 0)
            // we don't want to change the page number back. The user can go back manually.
          }
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      if (isMountedRef.current) {
        setAllReports([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };
  
  useEffect(() => {
    isMountedRef.current = true;
    setAllReports([]);
    setLoading(true);
    setLastVisible(null);
    setFirstVisible(null);
    setPage(1);
    fetchReports("first");
    
    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, firestore, projectRelevantSalesCodes]);

  useEffect(() => {
    if (!searchQuery) {
        setFilteredReports(allReports);
        return;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = allReports.filter(report => {
        return Object.values(report).some(value => 
            String(value).toLowerCase().includes(lowercasedQuery)
        );
    });
    setFilteredReports(filtered);
  }, [searchQuery, allReports]);
  
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

  if (loading && allReports.length === 0) {
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
      {(!loading && filteredReports.length === 0) ? (
         <p className="text-center text-muted-foreground py-8">
            Tidak ada laporan yang ditemukan untuk filter yang dipilih.
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
                    filteredReports.map((report, index) => (
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
                    disabled={allReports.length < PAGE_SIZE || page * PAGE_SIZE >= totalCount || loading}
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

export default function SpvReportsPage() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const firestore = useFirestore();
  
  const teamMembersQuery = useMemo(() => 
    firestore && currentUser
      ? query(collection(firestore, "users"), where("supervisorId", "==", currentUser.uid))
      : null
  , [firestore, currentUser]);
  const { data: teamMembers, loading: teamLoading } = useCollectionOnce<AppUser>(teamMembersQuery);

  const teamProjectIds = useMemo(() => {
    if (!teamMembers) return [];
    const projectIds = new Set<string>();
    teamMembers.forEach(member => {
      member.projectAssignments?.forEach(pa => projectIds.add(pa.projectId));
    });
    return Array.from(projectIds);
  }, [teamMembers]);

  const projectsQuery = useMemo(
    () => (firestore && teamProjectIds.length > 0 ? query(collection(firestore, "projects"), where("status", "==", "Aktif"), where("__name__", "in", teamProjectIds)) : null),
    [firestore, teamProjectIds]
  );
  const { data: projects, loading: projectsLoading } = useCollectionOnce<Project>(projectsQuery);
  
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const [selectedSalesId, setSelectedSalesId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (projects && projects.length > 0 && !activeTab) {
      setActiveTab(formatNameToId(projects[0].name));
    }
  }, [projects, activeTab]);
  
  const loading = userLoading || teamLoading || projectsLoading;

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-center">
            <AppLogo size={144} />
            <p className="text-sm text-muted-foreground font-semibold">Bangun Karier, Mulai Dari Magang</p>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memuat laporan tim...</p>
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Laporan Tim"
          description="Lihat laporan kinerja dan penjualan untuk tim Anda."
        />
        <Card>
          <CardHeader>
            <CardTitle>Tidak Ada Proyek Aktif Ditemukan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Tidak ada proyek aktif yang ditugaskan kepada tim Anda.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Laporan Tim"
        description="Lihat laporan yang difilter berdasarkan proyek untuk tim Anda."
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle>
                      Laporan untuk {project.name.toUpperCase().replace(/_/g, " ")}
                    </CardTitle>
                    <CardDescription>
                      Menampilkan laporan untuk tim Anda pada proyek {project.name.toUpperCase().replace(/_/g, " ")}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari laporan..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:min-w-[200px]">
                      <Select
                        value={selectedSalesId}
                        onValueChange={(value) => setSelectedSalesId(value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filter Berdasarkan Sales" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Sales</SelectItem>
                          {teamMembers?.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FilteredReportsTable
                  project={project}
                  teamMembers={teamMembers || []}
                  selectedSalesId={selectedSalesId}
                  searchQuery={searchQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

    
