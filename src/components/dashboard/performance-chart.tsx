
"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { subDays, format, eachDayOfInterval, startOfDay, parse, parseISO } from 'date-fns';
import type { Report } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

const chartConfig = {
  reports: {
    label: "Laporan",
    color: "hsl(var(--primary))",
  },
}

type PerformanceChartProps = {
  reports: Report[] | null | undefined;
}

const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};


const findDateInReport = (report: Report): Date | null => {
    const dateFields = ['date', 'TANGGAL', 'Incoming Date', 'createdAt', 'created_at', 'timestamp'];
    for (const field of dateFields) {
        const value = report[field];
        if (!value) continue;

        try {
            if (value instanceof Date) return value;
            if (isFirestoreTimestamp(value)) return value.toDate();
            if (typeof value === 'string') {
                let date = parseISO(value);
                if (!isNaN(date.getTime())) return date;
                
                date = parse(value, 'M/d/yyyy', new Date());
                if (!isNaN(date.getTime())) return date;

                 date = parse(value, 'd/M/yyyy', new Date());
                if (!isNaN(date.getTime())) return date;
            }
        } catch (e) {
            // Ignore parsing errors and try the next field
        }
    }
    return null;
}


export function PerformanceChart({ reports }: PerformanceChartProps) {
  const today = startOfDay(new Date());
  const last7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  });

  if (!reports) {
    return <div className="text-center text-muted-foreground p-4">Tidak ada data untuk ditampilkan.</div>;
  }

  const chartData = last7Days.map(day => {
    const dayReports = reports.filter(report => {
        const reportDate = findDateInReport(report);
        return reportDate && startOfDay(reportDate).getTime() === day.getTime();
      }).length;
      
    return {
      day: format(day, 'EEE'),
      reports: dayReports,
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
        <Bar dataKey="reports" fill="var(--color-reports)" radius={8} />
      </BarChart>
    </ChartContainer>
  )
}
