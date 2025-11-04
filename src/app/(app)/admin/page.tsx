
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
} from "@/components/ui/card";
import type { AppUser } from '@/hooks/use-current-user';
import type { Project } from "@/lib/mock-data";
import type { Sale } from "@/lib/mock-data";

export default function AdminDashboard() {
  const firestore = useFirestore();

  const { data: users, loading: usersLoading } = useCollection<AppUser>(firestore ? collection(firestore, "users") : null);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(firestore ? collection(firestore, "projects") : null);
  const { data: sales, loading: salesLoading } = useCollection<Sale>(firestore ? collection(firestore, "sales") : null);

  if (usersLoading || projectsLoading || salesLoading) {
    return <div>Loading Dashboard...</div>
  }

  const totalSales = sales?.reduce((acc, sale) => acc + sale.amount, 0) || 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Admin Dashboard" description="Manage users, projects, and view overall performance." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Users"
          value={users?.length.toString() || '0'}
          icon={Users}
          description="All users in the system"
        />
        <StatCard
          title="Total Projects"
          value={projects?.length.toString() || '0'}
          icon={Briefcase}
          description="All projects being tracked"
        />
        <StatCard
          title="Total Sales"
          value={`$${totalSales.toLocaleString()}`}
          icon={DollarSign}
          description="Total revenue from all projects"
        />
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Management</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
