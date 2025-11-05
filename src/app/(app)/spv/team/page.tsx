
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TeamPerformanceTable } from "@/components/spv/team-performance-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AddSalesForm } from "@/components/spv/add-sales-form";

export default function TeamPage() {
  const { user, loading } = useCurrentUser();
  const [isAddSalesOpen, setIsAddSalesOpen] = useState(false);

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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tabel Kinerja</CardTitle>
            <CardDescription>
              Menampilkan rincian penjualan dan progres target untuk setiap anggota tim.
            </CardDescription>
          </div>
          <Dialog open={isAddSalesOpen} onOpenChange={setIsAddSalesOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Anggota Tim
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Anggota Tim Sales Baru</DialogTitle>
                <DialogDescription>
                  Isi detail sales di bawah ini. Akun baru akan memerlukan persetujuan dari Admin.
                </DialogDescription>
              </DialogHeader>
              <AddSalesForm 
                supervisorId={user.uid} 
                onSuccess={() => setIsAddSalesOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <TeamPerformanceTable supervisorId={user.uid} />
        </CardContent>
      </Card>
    </div>
  );
}
