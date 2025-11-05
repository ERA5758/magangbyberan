
"use client"

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { DollarSign, Hash, BarChart, Loader2, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { RecentSales } from "@/components/sales/recent-sales";
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


export default function SalesDashboard() {
  const { user, loading } = useCurrentUser();
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

  const allSalespersonsQuery = useMemo(() => 
    firestore ? query(collection(firestore, "users"), where("role", "==", "Sales")) : null
  , [firestore]);
  const { data: allSalespersons, loading: usersLoading } = useCollection<AppUser>(allSalespersonsQuery);
  
  const allReportsQuery = useMemo(() => 
    firestore ? collection(firestore, "reports") : null
  , [firestore]);
  const { data: allReports, loading: allReportsLoading } = useCollection<Report>(allReportsQuery);

  const projectsQuery = useMemo(() => 
    firestore ? collection(firestore, "projects") : null
  , [firestore]);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsQuery);


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

  const { myTotalIncome, myRank, reportsByProject } = useMemo(() => {
    if (loading || reportsLoading || usersLoading || allReportsLoading || projectsLoading || !user || !myReports || !allSalespersons || !allReports || !projects) {
        return { myTotalIncome: 0, myRank: 0, reportsByProject: [] };
    }

    const calculateIncome = (reports: Report[], targetUser: AppUser) => {
        const targetSalesCodes = targetUser.projectAssignments?.map(pa => pa.salesCode) || [];
        if (targetUser.salesCode) targetSalesCodes.push(targetUser.salesCode);
        
        const userReports = reports.filter(r => targetSalesCodes.includes(r['Sales Code']));
        return userReports.reduce((acc, report) => {
            const project = projects.find(p => p.name.toLowerCase().replace(/ /g, '_') === report.projectId);
            return acc + (project?.feeSales || 0);
        }, 0);
    };

    const myTotalIncome = calculateIncome(allReports, user);

    const allIncomes = allSalespersons.map(salesperson => calculateIncome(allReports, salesperson)).sort((a, b) => b - a);
    const myRank = myTotalIncome > 0 ? allIncomes.indexOf(myTotalIncome) + 1 : 0;
    
    const userProjectIds = user.projectAssignments?.map(pa => pa.projectId) || [];
    const myProjects = projects.filter(p => userProjectIds.includes(p.id));

    const reportsByProject = myProjects.map(project => {
        const projectIdentifier = project.name.toLowerCase().replace(/ /g, '_');
        const projectReportsCount = myReports.filter(report => report.projectId === projectIdentifier).length;
        return {
          ...project,
          reportCount: projectReportsCount,
        };
      }).filter(p => p.reportCount > 0);

    return { myTotalIncome, myRank, reportsByProject };

  }, [loading, reportsLoading, usersLoading, allReportsLoading, projectsLoading, user, myReports, allSalespersons, allReports, projects]);


  if (loading || reportsLoading || usersLoading || allReportsLoading || projectsLoading || !user) {
    return <div>Memuat...</div>;
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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Pendapatan Saya"
          value={formatCurrency(myTotalIncome)}
          icon={DollarSign}
          description="Total pendapatan Anda bulan ini"
        />
        <StatCard
          title="Peringkat Perusahaan"
          value={myRank > 0 ? `#${myRank}`: 'N/A'}
          icon={BarChart}
          description={allSalespersons ? `dari ${allSalespersons.length} tenaga penjualan` : ''}
        />
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Laporan per Proyek</CardTitle>
                </CardHeader>
                <CardContent>
                {(loading || reportsLoading || projectsLoading) ? <Skeleton className="h-10 w-full" /> : (
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
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Laporan Terkini</CardTitle>
                <CardDescription>Transaksi laporan terbaru Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentSales salesCodes={userSalesCodes} />
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Performa Mingguan</CardTitle>
                <CardDescription>Tren laporan Anda selama seminggu terakhir.</CardDescription>
            </CardHeader>
            <CardContent>
                <PerformanceChart reports={myReports} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
