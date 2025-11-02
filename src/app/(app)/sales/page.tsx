"use client"

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { sales, users } from "@/lib/mock-data";
import { DollarSign, Hash, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
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

export default function SalesDashboard() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!user) return null;

  const mySales = sales.filter(s => s.salesCode === user.salesCode);
  const totalMySales = mySales.reduce((acc, sale) => acc + sale.amount, 0);
  const allSalesTotals = users
    .filter(u => u.role === 'Sales')
    .map(u => {
      return sales
        .filter(s => s.salesCode === u.salesCode)
        .reduce((acc, sale) => acc + sale.amount, 0);
    })
    .sort((a, b) => b - a);

  const myRank = allSalesTotals.indexOf(totalMySales) + 1;

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast({
      title: "Refreshing Data...",
      description: "Fetching the latest sales information from Google Sheets.",
    });
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Data Refreshed",
        description: "Your sales data is up to date.",
      });
    }, 2000);
  };

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
          value={`#${myRank}`}
          icon={BarChart}
          description={`out of ${allSalesTotals.length} salespersons`}
        />
        <StatCard
          title="Deals Closed"
          value={mySales.length.toString()}
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
                <PerformanceChart />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
