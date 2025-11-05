
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { Users, Briefcase, UserCog, UserSquare, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { AppUser, Project } from '@/lib/types';
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectSalesSummary } from "@/components/admin/project-sales-summary";
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once";

export default function AdminDashboard() {
  const firestore = useFirestore();

  const usersCollection = useMemo(() => firestore ? collection(firestore, "users") : null, [firestore]);
  const projectsCollection = useMemo(() => firestore ? collection(firestore, "projects") : null, [firestore]);

  const { data: users, loading: usersLoading } = useCollectionOnce<AppUser>(usersCollection);
  const { data: projects, loading: projectsLoading } = useCollectionOnce<Project>(projectsCollection);

  const isLoading = usersLoading || projectsLoading;

  const userRoleCounts = useMemo(() => {
    if (!users) {
      return { Admin: 0, SPV: 0, Sales: 0, Total: 0 };
    }
    const counts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<'Admin' | 'SPV' | 'Sales', number>);
    return {
      Admin: counts.Admin || 0,
      SPV: counts.SPV || 0,
      Sales: counts.Sales || 0,
      Total: users.length,
    }
  }, [users]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dasbor Admin" description="Selamat datang kembali! Berikut adalah ringkasan platform Anda." />
      
      <div className="grid gap-4 md:grid-cols-2">
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Pengguna</CardTitle>
             <CardDescription>Total {isLoading ? '...' : userRoleCounts.Total} pengguna terdaftar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
             {isLoading ? (
                <>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </>
             ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                    <span>Admin</span>
                  </div>
                  <span className="font-semibold">{userRoleCounts.Admin}</span>
                </div>
                 <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <UserSquare className="h-4 w-4 text-muted-foreground" />
                    <span>SPV</span>
                  </div>
                  <span className="font-semibold">{userRoleCounts.SPV}</span>
                </div>
                 <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Sales</span>
                  </div>
                  <span className="font-semibold">{userRoleCounts.Sales}</span>
                </div>
              </>
             )}
          </CardContent>
        </Card>
        <StatCard
          title="Total Proyek"
          value={isLoading ? <Skeleton className="h-6 w-16" /> : projects?.length.toString() || '0'}
          icon={Briefcase}
          description="Semua proyek aktif dan selesai"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Penjualan Proyek</CardTitle>
            <CardDescription>Jumlah total laporan (penjualan) yang tercatat untuk setiap proyek.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectSalesSummary />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
