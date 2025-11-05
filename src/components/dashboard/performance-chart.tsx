
"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { subDays, format, eachDayOfInterval, startOfDay, parse } from 'date-fns';
import type { Sale } from "@/lib/types";

const chartConfig = {
  sales: {
    label: "Penjualan",
    color: "hsl(var(--primary))",
  },
}

type PerformanceChartProps = {
  sales: Sale[] | null | undefined;
}

const findDateInSale = (sale: Sale): Date | null => {
    const dateFields = ['date', 'Incoming Date', 'Tanggal', 'createdAt'];
    for (const field of dateFields) {
        const value = sale[field];
        if (!value) continue;

        try {
            if (value instanceof Date) return value;
            if (typeof value === 'string') {
                let date = new Date(value);
                if (!isNaN(date.getTime())) return date;

                date = parse(value, 'M/d/yyyy', new Date());
                if (!isNaN(date.getTime())) return date;

                 date = parse(value, 'd/M/yyyy', new Date());
                if (!isNaN(date.getTime())) return date;
            }
            if (typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
                return value.toDate();
            }
        } catch (e) {
            // Ignore parsing errors and try the next field
        }
    }
    return null;
}


export function PerformanceChart({ sales }: PerformanceChartProps) {
  const today = startOfDay(new Date());
  const last7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  });

  if (!sales) {
    return <div className="text-center text-muted-foreground p-4">Tidak ada data untuk ditampilkan.</div>;
  }

  const chartData = last7Days.map(day => {
    const daySales = sales
      .map(sale => {
        const saleDate = findDateInSale(sale);
        const saleAmount = sale.amount || 0;
        return { saleDate, saleAmount };
      })
      .filter(item => item.saleDate && startOfDay(item.saleDate).getTime() === day.getTime())
      .reduce((acc, item) => acc + item.saleAmount, 0);
      
    return {
      day: format(day, 'EEE'),
      sales: daySales,
    };
  });

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
      </BarChart>
    </ChartContainer>
  )
}
