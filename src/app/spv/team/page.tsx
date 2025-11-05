
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { TeamPerformanceTable } from "@/components/spv/team-performance-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function TeamPage() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return <div>Memuat...</div>;
  }

  if (!user) {
    return <div>Harap login untuk melihat halaman ini.</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kinerja Tim Saya"
        description="Pantau dan kelola kinerja anggota tim penjualan Anda."
      />
      <Card>
        <CardHeader>
            <CardTitle>Tabel Kinerja</CardTitle>
            <CardDescription>
              Menampilkan rincian penjualan dan progres target untuk setiap anggota tim.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamPerformanceTable supervisorId={user.uid} />
        </CardContent>
      </Card>
    </div>
  );
}
