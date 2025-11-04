
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
import type { Sale } from "@/lib/mock-data";
import type { AppUser } from "@/hooks/use-current-user";


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
      title: "Refreshing Data...",
      description: "Fetching the latest sales information.",
    });

    // In a real app, you might re-fetch data here.
    // with react-query or SWR, you'd invalidate queries.
    // For this basic setup, we'll just simulate a delay.
    await new Promise(res => setTimeout(res, 1500));

    setIsRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Your sales data is up to date.",
    });
  };

  if (loading || salesLoading || usersLoading || allSalesLoading || !user) {
    return <div>Loading...</div>;
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
      <PageHeader title="My Sales Dashboard" description={`Welcome back, ${user.name}!`}>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh Data
        </Button>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="My Total Sales"
          value={`$${totalMySales.toLocaleString()}`}
          icon={DollarSign}
          description="Your total revenue generated this month"
        />
        <StatCard
          title="Company Rank"
          value={myRank > 0 ? `#${myRank}`: 'N/A'}
          icon={BarChart}
          description={allSalespersons ? `out of ${allSalespersons.length} salespersons` : ''}
        />
        <StatCard
          title="Deals Closed"
          value={mySales?.length.toString() || '0'}
          icon={Hash}
          description="Number of successful sales this month"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Your most recent sales transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentSales salesCode={user.salesCode} />
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
                <CardDescription>Your sales trend over the past week.</CardDescription>
            </CardHeader>
            <CardContent>
                <PerformanceChart sales={mySales} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
