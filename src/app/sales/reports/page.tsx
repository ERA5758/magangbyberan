
"use client";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function SalesReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Laporan Saya"
        description="Lihat laporan kinerja dan penjualan pribadi Anda."
      />
      <Card>
        <CardHeader>
          <CardTitle>Dalam Pengembangan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <Construction className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Halaman ini sedang dalam pengembangan dan akan segera tersedia.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
