
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
import type { Sale, AppUser } from "@/lib/types";
import { useMemo } from "react";

export default function SpvDashboard() {
  const { user, loading: userLoading } = useCurrentUser();
  const firestore = useFirestore();

  const teamMembersQuery = useMemo(() => 
    firestore && user
      ? query(collection(firestore, "users"), where("supervisorId", "==", user.uid))
      : null
  , [firestore, user]);
  const { data: teamMembers, loading: teamLoading } = useCollection<AppUser>(teamMembersQuery);

  const teamSalesCodes = useMemo(() => teamMembers?.map(m => m.salesCode).filter(Boolean) || [], [teamMembers]);

  const teamSalesQuery = useMemo(() => 
    firestore && teamSalesCodes && teamSalesCodes.length > 0
      ? query(collection(firestore, "sales"), where("salesCode", "in", teamSalesCodes))
      : null
  , [firestore, teamSalesCodes]);
  const { data: teamSales, loading: salesLoading } = useCollection<Sale>(teamSalesQuery);

  if (userLoading || teamLoading || salesLoading || !user) {
    return <div>Memuat...</div>
  }

  const totalSalesAmount = teamSales?.reduce((acc, sale) => acc + sale.amount, 0) || 0;
  
  const conversionRate = 35.5;

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
          title="Penjualan Tim (Bulan)"
          value={`$${totalSalesAmount.toLocaleString()}`}
          icon={DollarSign}
          description="Total pendapatan yang dihasilkan tim Anda bulan ini"
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
                <PerformanceChart sales={teamSales} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
