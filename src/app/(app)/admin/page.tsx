
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsersTable } from "@/components/admin/users-table";
import { ProjectsTable } from "@/components/admin/projects-table";
import { useCollection, useFirestore } from "@/firebase";
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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectSalesSummary } from "@/components/admin/project-sales-summary";

export default function AdminDashboard() {
  const firestore = useFirestore();

  const usersCollection = useMemo(() => firestore ? collection(firestore, "users") : null, [firestore]);
  const projectsCollection = useMemo(() => firestore ? collection(firestore, "projects") : null, [firestore]);

  const { data: users, loading: usersLoading } = useCollection<AppUser>(usersCollection);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsCollection);

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

       <Card>
        <CardHeader>
          <CardTitle>Ringkasan Penjualan Proyek</CardTitle>
          <CardDescription>Jumlah total laporan (penjualan) yang tercatat untuk setiap proyek.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectSalesSummary />
        </CardContent>
      </Card>


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
