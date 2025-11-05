
"use client"

import { useState, useMemo } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, User, Mail, Landmark, CreditCard, Phone, Home, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useFirestore } from "@/firebase"
import { collection, query, where, doc, updateDoc } from "firebase/firestore"
import { useCollection } from "@/firebase/firestore/use-collection"
import type { Sale, AppUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast"

type TeamPerformanceData = AppUser & {
    totalSales: number;
    salesCount: number;
}

export function TeamPerformanceTable({ supervisorId }: { supervisorId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamPerformanceData | null>(null);

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

    const performanceData: TeamPerformanceData[] = useMemo(() => {
        if (!teamMembers) return [];

        return teamMembers.map(member => {
            const memberSalesCodes = member.projectAssignments?.map(pa => pa.salesCode) || [];
            const memberSales = sales?.filter(s => memberSalesCodes.includes(s.salesCode)) || [];
            const totalSales = memberSales.reduce((acc, sale) => acc + sale.amount, 0);
            return {
                ...member,
                totalSales,
                salesCount: memberSales.length,
            }
        });
    }, [teamMembers, sales]);

    const handleRowClick = (data: TeamPerformanceData) => {
        setSelectedMember(data);
        setIsDetailOpen(true);
    };
    
    const getStatusBadgeVariant = (status?: AppUser['status']) => {
        switch (status) {
            case 'Aktif': return 'secondary';
            case 'Menunggu Persetujuan': return 'default';
            case 'Non Aktif': return 'destructive';
            default: return 'outline';
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedMember || !firestore) return;
        
        setIsUpdating(true);
        const newStatus = selectedMember.status === 'Aktif' ? 'Non Aktif' : 'Aktif';
        const userRef = doc(firestore, 'users', selectedMember.id);

        try {
            await updateDoc(userRef, { status: newStatus });
            toast({
                title: "Status Diperbarui",
                description: `Status untuk ${selectedMember.name} telah diubah menjadi ${newStatus}.`,
            });
            // Update local state to reflect change instantly
            setSelectedMember(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                variant: 'destructive',
                title: "Gagal Memperbarui Status",
                description: "Terjadi kesalahan. Silakan coba lagi."
            });
        } finally {
            setIsUpdating(false);
        }
    }

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
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">No.</TableHead>
                        <TableHead>Tenaga Penjualan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Jumlah Penjualan</TableHead>
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
                                <Badge variant={getStatusBadgeVariant(data.status)}>{data.status || 'Aktif'}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{data.salesCount}</TableCell>
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
                                    <DropdownMenuItem onClick={() => handleRowClick(data)}>Lihat Detail</DropdownMenuItem>
                                    <DropdownMenuItem>Kirim Pesan</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detail Anggota Tim</DialogTitle>
                        <DialogDescription>
                            Informasi lengkap untuk {selectedMember?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedMember && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                                    <AvatarFallback className="text-3xl">{selectedMember.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">{selectedMember.name}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" />{selectedMember.email}</p>
                                    <Badge variant={getStatusBadgeVariant(selectedMember.status)}>{selectedMember.status || 'Aktif'}</Badge>
                                </div>
                            </div>
                             <div className="grid grid-cols-1 gap-2 text-sm">
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">NIK</p>
                                        <p className="text-muted-foreground">{selectedMember.nik}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">No. HP</p>
                                        <p className="text-muted-foreground">{selectedMember.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Alamat</p>
                                        <p className="text-muted-foreground">{selectedMember.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Landmark className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Informasi Bank</p>
                                        <p className="text-muted-foreground">{selectedMember.bankName} - {selectedMember.accountNumber} (a.n. {selectedMember.accountHolder})</p>
                                    </div>
                                </div>
                             </div>
                             <div>
                                <h4 className="font-medium mb-2">Penugasan Proyek</h4>
                                <div className="space-y-2">
                                    {selectedMember.projectAssignments?.map(pa => (
                                        <div key={pa.projectId} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                            <span className="font-medium">Kode Sales:</span>
                                            <Badge variant="outline">{pa.salesCode}</Badge>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    )}
                    {selectedMember && selectedMember.status !== 'Menunggu Persetujuan' && (
                        <DialogFooter>
                            <Button
                                variant={selectedMember.status === 'Aktif' ? 'destructive' : 'default'}
                                onClick={handleToggleStatus}
                                disabled={isUpdating}
                            >
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {selectedMember.status === 'Aktif' ? 'Nonaktifkan Sales' : 'Aktifkan Sales'}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
