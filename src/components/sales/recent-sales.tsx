
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import type { Sale } from "@/lib/types";
import { useMemo } from "react";

export function RecentSales({ salesCode }: { salesCode: string }) {
    const firestore = useFirestore();

    const mySalesQuery = useMemo(() => 
        firestore ? query(
            collection(firestore, "sales"), 
            where("salesCode", "==", salesCode),
            orderBy("date", "desc")
        ) : null
    , [firestore, salesCode]);
    const { data: mySales, loading } = useCollection<Sale>(mySalesQuery);

    const handleRowClick = (sale: Sale) => {
        console.log("Sale clicked:", sale);
    };

    if (loading) {
        return <div>Loading recent sales...</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">No.</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {mySales && mySales.length > 0 ? mySales.map((sale, index) => (
                    <TableRow key={sale.id} onClick={() => handleRowClick(sale)} className="cursor-pointer">
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                            <div className="font-medium">{sale.projectName}</div>
                        </TableCell>
                        <TableCell>${sale.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{format(new Date(sale.date), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">
                            No recent sales found.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
    )
}
