
"use client"

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { DollarSign, Hash, BarChart, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { RecentSales } from "@/components/sales/recent-sales";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Sale, AppUser } from "@/lib/types";


export default function SalesDashboard() {
  const { user, loading } = useCurrentUser();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const firestore = useFirestore();

  const mySalesQuery = useMemo(() => 
    user && firestore ? query(collection(firestore, "sales"), where("salesCode", "==", user.salesCode)) : null
  , [user, firestore]);
  const { data: mySales, loading: salesLoading } = useCollection<Sale>(mySalesQuery);

  const allSalespersonsQuery = useMemo(() => 
    firestore ? query(collection(firestore, "users"), where("role", "==", "Sales")) : null
  , [firestore]);
  const { data: allSalespersons, loading: usersLoading } = useCollection<AppUser>(allSalespersonsQuery);
  
  const allSalesQuery = useMemo(() => 
    firestore ? collection(firestore, "sales") : null
  , [firestore]);
  const { data: allSales, loading: allSalesLoading } = useCollection<Sale>(allSalesQuery);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast({
      title: "Menyegarkan Data...",
      description: "Mengambil informasi penjualan terbaru.",
    });

    await new Promise(res => setTimeout(res, 1500));

    setIsRefreshing(false);
    toast({
      title: "Data Disegarkan",
      description: "Data penjualan Anda sudah yang terbaru.",
    });
  };

  if (loading || salesLoading || usersLoading || allSalesLoading || !user) {
    return <div>Memuat...</div>;
  }

  const totalMySales = mySales?.reduce((acc, sale) => acc + sale.amount, 0) || 0;
  
  const allSalesTotals = allSalespersons?.map(u => {
      return allSales
        ?.filter(s => s.salesCode === u.salesCode)
        .reduce((acc, sale) => acc + sale.amount, 0) || 0;
    })
    .sort((a, b) => b - a) || [];

  const myRank = totalMySales > 0 ? allSalesTotals.indexOf(totalMySales) + 1 : 0;


  return (
    <div className="space-y-8">
      <PageHeader title="Dasbor Penjualan Saya" description={`Selamat datang kembali, ${user.name}!`}>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Segarkan Data
        </Button>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Penjualan Saya"
          value={`$${totalMySales.toLocaleString()}`}
          icon={DollarSign}
          description="Total pendapatan Anda bulan ini"
        />
        <StatCard
          title="Peringkat Perusahaan"
          value={myRank > 0 ? `#${myRank}`: 'N/A'}
          icon={BarChart}
          description={allSalespersons ? `dari ${allSalespersons.length} tenaga penjualan` : ''}
        />
        <StatCard
          title="Transaksi Berhasil"
          value={mySales?.length.toString() || '0'}
          icon={Hash}
          description="Jumlah penjualan sukses bulan ini"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Penjualan Terkini</CardTitle>
                <CardDescription>Transaksi penjualan terbaru Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentSales salesCode={user.salesCode} />
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Performa Mingguan</CardTitle>
                <CardDescription>Tren penjualan Anda selama seminggu terakhir.</CardDescription>
            </CardHeader>
            <CardContent>
                <PerformanceChart sales={mySales} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
