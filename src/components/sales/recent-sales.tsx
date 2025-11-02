"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { sales } from "@/lib/mock-data"
import { format } from "date-fns"

export function RecentSales({ salesCode }: { salesCode: string }) {
    const mySales = sales
        .filter(s => s.salesCode === salesCode)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5); // Show top 5 recent sales

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {mySales.length > 0 ? mySales.map((sale) => (
                    <TableRow key={sale.id}>
                        <TableCell>
                            <div className="font-medium">{sale.projectName}</div>
                        </TableCell>
                        <TableCell>${sale.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{format(new Date(sale.date), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">
                            No recent sales found.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
    )
}
