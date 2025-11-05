
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsersTable } from "@/components/admin/users-table";
import { ProjectsTable } from "@/components/admin/projects-table";
import { useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { Users, Briefcase, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { AppUser, Project, Sale } from '@/lib/types';
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const firestore = useFirestore();

  const usersCollection = useMemo(() => firestore ? collection(firestore, "users") : null, [firestore]);
  const projectsCollection = useMemo(() => firestore ? collection(firestore, "projects") : null, [firestore]);
  const salesCollection = useMemo(() => firestore ? collection(firestore, "sales") : null, [firestore]);

  const { data: users, loading: usersLoading } = useCollection<AppUser>(usersCollection);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsCollection);
  const { data: sales, loading: salesLoading } = useCollection<Sale>(salesCollection);

  const totalSales = sales?.reduce((acc, sale) => acc + sale.amount, 0) || 0;
  const isLoading = usersLoading || projectsLoading || salesLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Dasbor Admin" description="Selamat datang kembali! Berikut adalah ringkasan platform Anda." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <StatCard
          title="Total Penjualan"
          value={isLoading ? <Skeleton className="h-6 w-28" /> : `$${totalSales.toLocaleString()}`}
          icon={DollarSign}
          description="Total pendapatan dari semua proyek"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manajemen Pengguna</CardTitle>
                    <CardDescription>Lihat, tambah, atau kelola pengguna.</CardDescription>
                </div>
                <Button asChild size="sm">
                    <Link href="/admin/users">Lihat Semua</Link>
                </Button>
            </CardHeader>
            <CardContent>
                <UsersTable />
            </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-1">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Proyek</CardTitle>
                    <CardDescription>Kelola semua proyek perusahaan.</CardDescription>
                </div>
                 <Button asChild size="sm">
                    <Link href="/admin/projects">Lihat Semua</Link>
                </Button>
            </CardHeader>
            <CardContent>
                <ProjectsTable />
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
