
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useCollection, useFirestore } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import type { Sale, AppUser } from "@/lib/types";
import { useMemo } from "react"

type TeamPerformanceData = {
    id: string;
    name: string;
    avatar: string;
    email: string;
    status: 'Aktif' | 'Menunggu Persetujuan';
    totalSales: number;
    salesCount: number;
    salesTarget: number;
}

export function TeamPerformanceTable({ supervisorId }: { supervisorId: string }) {
    const firestore = useFirestore();

    const teamMembersQuery = useMemo(() => 
        firestore && supervisorId
            ? query(collection(firestore, "users"), where("supervisorId", "==", supervisorId))
            : null
    , [firestore, supervisorId]);
    const { data: teamMembers, loading: membersLoading } = useCollection<AppUser>(teamMembersQuery);
    
    const teamSalesCodes = useMemo(() => teamMembers?.flatMap(m => m.projectAssignments?.map(pa => pa.salesCode)).filter(Boolean) || [], [teamMembers]);

    const salesQuery = useMemo(() => 
        firestore && teamSalesCodes && teamSalesCodes.length > 0 
            ? query(collection(firestore, "sales"), where("salesCode", "in", teamSalesCodes)) 
            : null
    , [firestore, teamSalesCodes]);
    const { data: sales, loading: salesLoading } = useCollection<Sale>(salesQuery);

    const performanceData = useMemo(() => {
        if (!teamMembers) return [];

        return teamMembers.map(member => {
            const memberSalesCodes = member.projectAssignments?.map(pa => pa.salesCode) || [];
            const memberSales = sales?.filter(s => memberSalesCodes.includes(s.salesCode)) || [];
            const totalSales = memberSales.reduce((acc, sale) => acc + sale.amount, 0);
            return {
                id: member.id,
                name: member.name,
                avatar: member.avatar,
                email: member.email,
                status: member.status || 'Aktif',
                totalSales,
                salesCount: memberSales.length,
                salesTarget: 10000, // Mock target, can be moved to user/project data
            }
        });
    }, [teamMembers, sales]);

    const handleRowClick = (data: TeamPerformanceData) => {
        console.log("Viewing details for:", data.name);
    };
    
    const getStatusBadgeVariant = (status: TeamPerformanceData['status']) => {
        switch (status) {
            case 'Aktif': return 'secondary';
            case 'Menunggu Persetujuan': return 'default';
            default: return 'outline';
        }
    };

    if (membersLoading || salesLoading) {
        return <div>Memuat kinerja tim...</div>
    }

    if (!teamMembers || teamMembers.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8">
                Anda belum memiliki anggota tim.
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">No.</TableHead>
                    <TableHead>Tenaga Penjualan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jumlah Penjualan</TableHead>
                    <TableHead>Total Penjualan</TableHead>
                    <TableHead className="hidden md:table-cell">Progres Target</TableHead>
                    <TableHead>
                    <span className="sr-only">Aksi</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {performanceData.map((data, index) => (
                    <TableRow key={data.id} onClick={() => handleRowClick(data)} className="cursor-pointer">
                        <TableCell>{index + 1}</TableCell>
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
                        <TableCell>
                            <Badge variant={getStatusBadgeVariant(data.status)}>{data.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{data.salesCount}</TableCell>
                        <TableCell className="font-medium">${data.totalSales.toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                                <Progress value={(data.totalSales / data.salesTarget) * 100} className="h-2" />
                                <span className="text-xs text-muted-foreground">{Math.round((data.totalSales / data.salesTarget) * 100)}%</span>
                            </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Buka menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                                <DropdownMenuItem>Kirim Pesan</DropdownMenuItem>
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
