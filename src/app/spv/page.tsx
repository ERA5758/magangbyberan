
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { TeamPerformanceTable } from "@/components/spv/team-performance-table";
import { UsersRound, DollarSign, ClipboardList, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Sale, AppUser, Project, Report } from "@/lib/types";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { totalCommission, teamSalesForChart, salesByProject } = useMemo(() => {
    if (!teamReports || !projects) {
      return { totalCommission: 0, teamSalesForChart: [], salesByProject: [] };
    }

    let totalCommission = 0;
    const teamSalesForChart: Sale[] = [];
    
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
      // Create a Sale-like object for the chart
      teamSalesForChart.push({
        id: report.id,
        amount: project?.feeSpv || 0,
        date: report.createdAt, // Assuming createdAt is available and is a timestamp
        salesCode: report["Sales Code"],
        projectName: project?.name || report.projectId,
      });
    });

    return { totalCommission, teamSalesForChart, salesByProject };
  }, [teamReports, projects]);
  
  const totalTeamSalesCount = teamReports?.length || 0;

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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Kinerja Tim</CardTitle>
            </CardHeader>
            <CardContent>
                {user.uid && <TeamPerformanceTable supervisorId={user.uid} />}
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Tren Penjualan Mingguan</CardTitle>
            </CardHeader>
            <CardContent>
                <PerformanceChart sales={teamSalesForChart} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
