
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { TeamPerformanceTable } from "@/components/spv/team-performance-table";
import { UsersRound, DollarSign, Percent } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Sale, AppUser, Project, Report } from "@/lib/types";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

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
    return teamMembers.flatMap(m => m.projectAssignments?.map(pa => pa.salesCode) || []);
  }, [teamMembers]);

  const teamReportsQuery = useMemo(() => 
    firestore && teamSalesCodes && teamSalesCodes.length > 0
      ? query(collection(firestore, "reports"), where("Sales Code", "in", teamSalesCodes))
      : null
  , [firestore, teamSalesCodes]);
  const { data: teamReports, loading: reportsLoading } = useCollection<Report>(teamReportsQuery);

  const projectsQuery = useMemo(() => firestore ? collection(firestore, "projects") : null, [firestore]);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsQuery);

  const loading = userLoading || teamLoading || reportsLoading || projectsLoading;

  const { totalCommission, teamSalesForChart } = useMemo(() => {
    if (!teamReports || !projects) {
      return { totalCommission: 0, teamSalesForChart: [] };
    }

    let totalCommission = 0;
    const teamSalesForChart: Sale[] = [];

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

    return { totalCommission, teamSalesForChart };
  }, [teamReports, projects]);

  if (loading || !user) {
    return <div>Memuat...</div>
  }
  
  const conversionRate = 35.5; // Placeholder

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
        <StatCard
          title="Tingkat Konversi"
          value={`${conversionRate}%`}
          icon={Percent}
          description="Tingkat konversi prospek menjadi penjualan untuk tim"
        />
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
