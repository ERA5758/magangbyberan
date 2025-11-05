
"use client";
import { UsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="User Management"
        description="View, add, or manage all users on the platform."
      />
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users in the system. Click 'Add User' to create a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable />
        </CardContent>
      </Card>
    </div>
  );
}
