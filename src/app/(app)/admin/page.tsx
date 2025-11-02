import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsersTable } from "@/components/admin/users-table";
import { ProjectsTable } from "@/components/admin/projects-table";
import { users, projects, sales } from "@/lib/mock-data";
import { Users, Briefcase, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboard() {
  const totalSales = sales.reduce((acc, sale) => acc + sale.amount, 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Admin Dashboard" description="Manage users, projects, and view overall performance." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Users"
          value={users.length.toString()}
          icon={Users}
          description="All users in the system"
        />
        <StatCard
          title="Total Projects"
          value={projects.length.toString()}
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

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
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
