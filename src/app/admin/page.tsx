
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { Users, Briefcase } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <PageHeader title="Dasbor Admin" description="Selamat datang kembali! Berikut adalah ringkasan platform Anda." />
      
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Pengguna"
          value={isLoading ? <Skeleton className="h-6 w-20" /> : users?.length.toString() || '0'}
          icon={Users}
          description="Jumlah pengguna terdaftar"
        />
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
