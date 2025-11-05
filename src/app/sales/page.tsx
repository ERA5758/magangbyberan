
"use client"

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { DollarSign, Hash, BarChart, Loader2, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Report, AppUser, Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once";


export default function SalesDashboard() {
  const { user, loading: userLoading } = useCurrentUser();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const firestore = useFirestore();

  const userSalesCodes = useMemo(() => {
    if (!user) return [];
    const codes = user.projectAssignments?.map(pa => pa.salesCode) || [];
    if(user.salesCode && !codes.includes(user.salesCode)) {
        codes.push(user.salesCode);
    }
    return codes.filter(Boolean);
  }, [user]);

  const myReportsQuery = useMemo(() => 
    user && userSalesCodes.length > 0 && firestore 
      ? query(collection(firestore, "reports"), where("Sales Code", "in", userSalesCodes)) 
      : null
  , [user, userSalesCodes, firestore]);
  const { data: myReports, loading: reportsLoading } = useCollection<Report>(myReportsQuery);

  const assignedProjectIds = useMemo(() => {
    if (!user?.projectAssignments) return [];
    return user.projectAssignments.map(pa => pa.projectId);
  }, [user]);

  const projectsQuery = useMemo(
    () => (firestore && assignedProjectIds.length > 0 ? query(collection(firestore, "projects"), where("status", "==", "Aktif"), where("__name__", "in", assignedProjectIds)) : null),
    [firestore, assignedProjectIds]
  );
  const { data: projects, loading: projectsLoading } = useCollectionOnce<Project>(projectsQuery);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast({
      title: "Menyegarkan Data...",
      description: "Mengambil informasi penjualan terbaru.",
    });

    // Simulate data fetching
    await new Promise(res => setTimeout(res, 1500));

    setIsRefreshing(false);
    toast({
      title: "Data Disegarkan",
      description: "Data penjualan Anda sudah yang terbaru.",
    });
  };

  const { myTotalIncome, reportsByProject } = useMemo(() => {
    if (userLoading || reportsLoading || projectsLoading || !user || !myReports || !projects) {
        return { myTotalIncome: 0, reportsByProject: [] };
    }
    
    const projectFees: Record<string, number> = {};
    projects.forEach(p => {
        projectFees[p.name.toLowerCase().replace(/ /g, '_')] = p.feeSales || 0;
    });

    const myTotalIncome = myReports.reduce((acc, report) => {
        return acc + (projectFees[report.projectId] || 0);
    }, 0);
    
    const reportsCountByProject: Record<string, number> = {};
    myReports.forEach(report => {
        reportsCountByProject[report.projectId] = (reportsCountByProject[report.projectId] || 0) + 1;
    });

    const reportsByProject = projects.map(project => {
        const projectIdentifier = project.name.toLowerCase().replace(/ /g, '_');
        return {
          id: project.id,
          name: project.name,
          reportCount: reportsCountByProject[projectIdentifier] || 0,
        };
      }).filter(p => p.reportCount > 0);

    return { myTotalIncome, reportsByProject };

  }, [userLoading, reportsLoading, projectsLoading, user, myReports, projects]);

  const isLoading = userLoading || reportsLoading || projectsLoading;

  if (isLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memuat dasbor Anda...</p>
          </div>
        </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <PageHeader title="Dasbor Penjualan Saya" description={`Selamat datang kembali, ${user.name}!`}>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Segarkan Data
        </Button>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Pendapatan Saya"
          value={isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(myTotalIncome)}
          icon={DollarSign}
          description="Total pendapatan Anda bulan ini"
        />
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Laporan per Proyek</CardTitle>
            </CardHeader>
            <CardContent>
            {isLoading ? <Skeleton className="h-10 w-full" /> : (
              reportsByProject.length > 0 ? (
                <div className="space-y-2">
                  {reportsByProject.map(project => (
                    <div key={project.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium truncate">{project.name}</p>
                      </div>
                      <p className="font-semibold">{project.reportCount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Belum ada laporan.</p>
              )
            )}
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Performa Mingguan</CardTitle>
                <CardDescription>Tren laporan Anda selama seminggu terakhir.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="w-full h-[200px] flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <PerformanceChart reports={myReports} />
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
