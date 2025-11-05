
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils";

const chartConfig = {
  reports: {
    label: "Jumlah Laporan",
    color: "hsl(var(--chart-1))",
  },
  income: {
    label: "Total Pendapatan",
    color: "hsl(var(--chart-2))",
  },
} satisfies Record<string, { label: string; color: string }>;

type ChartData = {
    name: string;
    reports: number;
    income: number;
}

export function TeamPerformanceChart({ data }: { data: ChartData[] }) {

  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground p-8">Belum ada data performa tim untuk ditampilkan.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="hsl(var(--chart-1))"
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="hsl(var(--chart-2))"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${formatCurrency(value as number).replace('Rp', 'Rp ')}`}
                />
                <Tooltip
                    content={
                        <ChartTooltipContent
                            formatter={(value, name) => {
                                if (name === 'income') {
                                    return formatCurrency(value as number);
                                }
                                return value.toLocaleString();
                            }} 
                        />
                    }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="reports" fill="var(--color-reports)" name="Jumlah Laporan" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="income" fill="var(--color-income)" name="Total Pendapatan" radius={[4, 4, 0, 0]} />
            </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
