"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { spvTeams, users, sales } from "@/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

type TeamPerformanceData = {
    id: string;
    name: string;
    avatar: string;
    email: string;
    totalSales: number;
    salesCount: number;
    salesTarget: number;
}

export function TeamPerformanceTable({ spvCode }: { spvCode: string }) {
    const teamSalesCodes = spvTeams[spvCode] || [];
    const teamMembers = users.filter(u => teamSalesCodes.includes(u.salesCode));

    const performanceData: TeamPerformanceData[] = teamMembers.map(member => {
        const memberSales = sales.filter(s => s.salesCode === member.salesCode);
        const totalSales = memberSales.reduce((acc, sale) => acc + sale.amount, 0);
        return {
            id: member.id,
            name: member.name,
            avatar: member.avatar,
            email: member.email,
            totalSales,
            salesCount: memberSales.length,
            salesTarget: 10000, // Mock target
        }
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Sales Count</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead className="hidden md:table-cell">Target Progress</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {performanceData.map((data) => (
                    <TableRow key={data.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={data.avatar} alt={data.name} />
                                    <AvatarFallback>{data.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{data.name}</div>
                                    <div className="text-sm text-muted-foreground">{data.email}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">{data.salesCount}</TableCell>
                        <TableCell className="font-medium">${data.totalSales.toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                                <Progress value={(data.totalSales / data.salesTarget) * 100} className="h-2" />
                                <span className="text-xs text-muted-foreground">{Math.round((data.totalSales / data.salesTarget) * 100)}%</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Send Message</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
    )
}
