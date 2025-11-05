
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
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsQuery);


  const loading = userLoading || teamLoading || reportsLoading || projectsLoading;

  const { totalCommission, salesByProject, teamPerformanceData } = useMemo(() => {
    if (!teamReports || !projects || !teamMembers) {
      return { totalCommission: 0, salesByProject: [], teamPerformanceData: [] };
    }

    let totalCommission = 0;
    
    const salesByProject = projects.map(project => {
        const projectIdentifier = project.name.toLowerCase().replace(/ /g, '_');
        const projectSalesCount = teamReports.filter(report => report.projectId === projectIdentifier).length;
        return {
          ...project,
          salesCount: projectSalesCount,
        };
      }).filter(p => p.salesCount > 0);

    teamReports.forEach(report => {
      const project = projects.find(p => p.name.toLowerCase().replace(/ /g, '_') === report.projectId);
      if (project && project.feeSpv) {
        totalCommission += project.feeSpv;
      }
    });

    const teamPerformanceData = teamMembers.map(member => {
      const memberSalesCodes = member.projectAssignments?.map(pa => pa.salesCode) || [];
      if(member.salesCode) memberSalesCodes.push(member.salesCode);

      const memberReports = teamReports.filter(report => memberSalesCodes.includes(report["Sales Code"]));
      const memberIncome = memberReports.reduce((acc, report) => {
        const project = projects.find(p => p.name.toLowerCase().replace(/ /g, '_') === report.projectId);
        return acc + (project?.feeSales || 0);
      }, 0);

      return {
        name: member.name.split(' ')[0], // Use first name for chart label
        reports: memberReports.length,
        income: memberIncome,
      }
    });

    return { totalCommission, salesByProject, teamPerformanceData };
  }, [teamReports, projects, teamMembers]);
  

  if (loading || !user) {
    return <div>Memuat...</div>
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Dasbor Supervisor" description="Pantau kinerja dan data penjualan tim Anda." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Anggota Tim"
          value={teamMembers?.length.toString() || '0'}
          icon={UsersRound}
          description="Tenaga penjualan di bawah supervisi Anda"
        />
        <StatCard
          title="Total Komisi Tim (Bulan)"
          value={formatCurrency(totalCommission)}
          icon={DollarSign}
          description="Total komisi yang dihasilkan tim Anda bulan ini"
        />
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Penjualan Proyek Tim</CardTitle>
                </CardHeader>
                <CardContent>
                {loading ? <Skeleton className="h-10 w-full" /> : (
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
                <TeamPerformanceChart data={teamPerformanceData} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
