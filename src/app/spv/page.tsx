
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsersRound, DollarSign, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Sale, AppUser, Project, Report } from "@/lib/types";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamPerformanceChart } from "@/components/spv/team-performance-chart";
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once";
import { Loader2 } from "lucide-react";

export default function SpvDashboard() {
  const { user, loading: userLoading } = useCurrentUser();
  const firestore = useFirestore();

  const teamMembersQuery = useMemo(() => 
    firestore && user
      ? query(collection(firestore, "users"), where("supervisorId", "==", user.uid))
      : null
  , [firestore, user]);
  const { data: teamMembers, loading: teamLoading } = useCollection<AppUser>(teamMembersQuery);

  const teamSalesCodes = useMemo(() => {
    if (!teamMembers) return [];
    const codes = teamMembers.flatMap(m => m.projectAssignments?.map(pa => pa.salesCode) || []);
    // Also include legacy salesCode if present
    teamMembers.forEach(m => {
      if(m.salesCode && !codes.includes(m.salesCode)) {
        codes.push(m.salesCode);
      }
    });
    return codes.filter(Boolean); // remove any empty or null codes
  }, [teamMembers]);


  const teamReportsQuery = useMemo(() => 
    firestore && teamSalesCodes && teamSalesCodes.length > 0
      ? query(collection(firestore, "reports"), where("Sales Code", "in", teamSalesCodes))
      : null
  , [firestore, teamSalesCodes]);
  const { data: teamReports, loading: reportsLoading } = useCollection<Report>(teamReportsQuery);

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


  const isLoading = userLoading || teamLoading || reportsLoading || projectsLoading;

  const { totalCommission, salesByProject, teamPerformanceData } = useMemo(() => {
    if (!teamReports || !projects || !teamMembers) {
      return { totalCommission: 0, salesByProject: [], teamPerformanceData: [] };
    }

    const projectFees: Record<string, { feeSpv: number; feeSales: number; }> = {};
    projects.forEach(p => {
        projectFees[p.name.toLowerCase().replace(/ /g, '_')] = {
            feeSpv: p.feeSpv || 0,
            feeSales: p.feeSales || 0,
        };
    });

    const totalCommission = teamReports.reduce((acc, report) => {
        return acc + (projectFees[report.projectId]?.feeSpv || 0);
    }, 0);
    
    const salesCountByProject: Record<string, number> = {};
    teamReports.forEach(report => {
        salesCountByProject[report.projectId] = (salesCountByProject[report.projectId] || 0) + 1;
    });

    const salesByProject = projects.map(project => {
        const projectIdentifier = project.name.toLowerCase().replace(/ /g, '_');
        return {
          id: project.id,
          name: project.name,
          salesCount: salesCountByProject[projectIdentifier] || 0,
        };
      }).filter(p => p.salesCount > 0);

    const teamPerformanceData = teamMembers.map(member => {
      const memberSalesCodes = member.projectAssignments?.map(pa => pa.salesCode) || [];
      if(member.salesCode) memberSalesCodes.push(member.salesCode);

      const memberReports = teamReports.filter(report => memberSalesCodes.includes(report["Sales Code"]));
      
      const memberIncome = memberReports.reduce((acc, report) => {
        return acc + (projectFees[report.projectId]?.feeSales || 0);
      }, 0);

      return {
        name: member.name.split(' ')[0], // Use first name for chart label
        reports: memberReports.length,
        income: memberIncome,
      }
    });

    return { totalCommission, salesByProject, teamPerformanceData };
  }, [teamReports, projects, teamMembers]);
  

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
      <PageHeader title="Dasbor Supervisor" description="Pantau kinerja dan data penjualan tim Anda." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Anggota Tim"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : teamMembers?.length.toString() || '0'}
          icon={UsersRound}
          description="Tenaga penjualan di bawah supervisi Anda"
        />
        <StatCard
          title="Total Komisi Tim (Bulan)"
          value={isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(totalCommission)}
          icon={DollarSign}
          description="Total komisi yang dihasilkan tim Anda bulan ini"
        />
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Penjualan Proyek Tim</CardTitle>
                </CardHeader>
                <CardContent>
                {isLoading ? <Skeleton className="h-10 w-full" /> : (
                  salesByProject.length > 0 ? (
                    <div className="space-y-2">
                      {salesByProject.map(project => (
                        <div key={project.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium truncate">{project.name}</p>
                          </div>
                          <p className="font-semibold">{project.salesCount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">Belum ada penjualan.</p>
                  )
                )}
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Performa Tim Penjualan</CardTitle>
                <CardDescription>Jumlah laporan dan total pendapatan per anggota tim.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="w-full h-[300px] flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <TeamPerformanceChart data={teamPerformanceData} />
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
