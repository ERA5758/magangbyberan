
"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import type { Sale } from "@/lib/types";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
}

type PerformanceChartProps = {
  sales: Sale[] | null | undefined;
}

export function PerformanceChart({ sales }: PerformanceChartProps) {
  const today = startOfDay(new Date());
  const last7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  });

  const chartData = last7Days.map(day => {
    const daySales = sales?.filter(sale => startOfDay(new Date(sale.date)).getTime() === day.getTime())
                          .reduce((acc, sale) => acc + sale.amount, 0) || 0;
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
