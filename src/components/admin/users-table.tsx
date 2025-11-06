
"use client"

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, User, Mail, Landmark, Phone, Home, Loader2, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirestore } from "@/firebase"
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once"
import { collection, doc, updateDoc, deleteDoc } from "firebase/firestore"
import type { AppUser, Project } from "@/lib/types";
import { AddUserForm } from "./add-user-form";
import { useToast } from "@/hooks/use-toast";
import { BulkImportUsersForm } from "./bulk-import-users-form";

type UsersTableProps = {
    users: AppUser[] | null;
    loading: boolean;
    mutate: () => void;
};

export function UsersTable({ users, loading, mutate }: UsersTableProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const projectsQuery = useMemo(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
    const { data: projects, loading: projectsLoading } = useCollectionOnce<Project>(projectsQuery);

    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const projectsMap = useMemo(() => {
        if (!projects) return new Map();
        return new Map(projects.map(p => [p.id, p.name]));
    }, [projects]);
    
    const getRoleBadgeVariant = (role: AppUser['role']) => {
        switch (role) {
            case 'Admin': return 'default';
            case 'SPV': return 'secondary';
            case 'Sales': return 'outline';
            default: return 'outline';
        }
    };
    
    const getStatusBadgeVariant = (status?: AppUser['status']) => {
        switch (status) {
            case 'Aktif': return 'secondary';
            case 'Menunggu Persetujuan': return 'default';
            case 'Non Aktif': return 'destructive';
            default: return 'outline';
        }
    };

    const handleApprove = async (e: React.MouseEvent, user: AppUser) => {
        e.stopPropagation();
        if (!firestore) return;
        const userRef = doc(firestore, 'users', user.id);
        try {
            await updateDoc(userRef, { status: 'Aktif' });
            toast({ title: 'Pengguna Disetujui', description: `${user.name} sekarang aktif.` });
            mutate();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyetujui pengguna.' });
        }
    };

    const handleDelete = async (e: React.MouseEvent, user: AppUser) => {
        e.stopPropagation();
        if (!firestore) return;
        // Ideally, this should also call a serverless function to delete the Auth user.
        // For now, it just deletes the Firestore document.
        const userRef = doc(firestore, 'users', user.id);
        try {
            await deleteDoc(userRef);
            toast({ title: 'Pengguna Ditolak/Dihapus', description: `Data untuk ${user.name} telah dihapus.` });
            mutate();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus pengguna.' });
        }
    };

    const handleRowClick = (user: AppUser) => {
        setSelectedUser(user);
        setIsDetailOpen(true);
    };

     const handleToggleStatus = async () => {
        if (!selectedUser || !firestore) return;
        
        setIsUpdating(true);
        const newStatus = selectedUser.status === 'Aktif' ? 'Non Aktif' : 'Aktif';
        const userRef = doc(firestore, 'users', selectedUser.id);

        try {
            await updateDoc(userRef, { status: newStatus });
            toast({
                title: "Status Diperbarui",
                description: `Status untuk ${selectedUser.name} telah diubah menjadi ${newStatus}.`,
            });
            setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
            mutate(); // Re-fetch data
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


    if (loading || projectsLoading) {
        return <div>Memuat pengguna...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Impor Pengguna
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                         <DialogHeader>
                            <DialogTitle>Impor Pengguna Massal</DialogTitle>
                            <DialogDescription>
                                Unggah file CSV untuk menambahkan beberapa pengguna sekaligus.
                            </DialogDescription>
                        </DialogHeader>
                        <BulkImportUsersForm onSuccess={() => {
                            setIsBulkImportOpen(false);
                            mutate();
                        }} />
                    </DialogContent>
                </Dialog>

                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Pengguna
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] md:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                        <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                        <DialogDescription>
                            Isi formulir di bawah ini untuk membuat akun pengguna baru.
                        </DialogDescription>
                        </DialogHeader>
                        <AddUserForm onSuccess={() => {
                            setIsAddUserOpen(false)
                            mutate();
                        }} />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">No.</TableHead>
                        <TableHead>Pengguna</TableHead>
                        <TableHead>Peran</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Proyek & Kode Sales</TableHead>
                        <TableHead>
                        <span className="sr-only">Aksi</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users && users.map((user, index) => (
                        <TableRow key={user.id} onClick={() => handleRowClick(user)} className="cursor-pointer">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                            </TableCell>
                             <TableCell>
                                <Badge variant={getStatusBadgeVariant(user.status)}>{user.status || 'Aktif'}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                    {user.projectAssignments && user.projectAssignments.map((pa) => (
                                        <Badge key={pa.projectId} variant="outline" title={projectsMap.get(pa.projectId) || pa.projectId}>{pa.salesCode}</Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Buka menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleRowClick(user);}}>Lihat Detail</DropdownMenuItem>
                                    {user.status === 'Menunggu Persetujuan' && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={(e) => handleApprove(e, user)}>Setujui Pengguna</DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => handleDelete(e, user)} className="text-destructive">Tolak Pengguna</DropdownMenuItem>
                                        </>
                                    )}
                                    {user.status !== 'Menunggu Persetujuan' && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                // logic for editing user
                                                toast({title: "Fitur Dalam Pengembangan", description: "Mengubah pengguna akan segera tersedia."})
                                            }}>Ubah</DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => handleDelete(e, user)} className="text-destructive">Hapus</DropdownMenuItem>
                                        </>
                                    )}
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
                        <DialogTitle>Detail Pengguna</DialogTitle>
                        <DialogDescription>
                            Informasi lengkap untuk {selectedUser?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                                    <AvatarFallback className="text-3xl">{selectedUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" />{selectedUser.email}</p>
                                    <Badge variant={getStatusBadgeVariant(selectedUser.status)}>{selectedUser.status || 'Aktif'}</Badge>
                                </div>
                            </div>
                             <div className="grid grid-cols-1 gap-2 text-sm">
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">NIK</p>
                                        <p className="text-muted-foreground">{selectedUser.nik}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">No. HP</p>
                                        <p className="text-muted-foreground">{selectedUser.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Alamat</p>
                                        <p className="text-muted-foreground">{selectedUser.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Landmark className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Informasi Bank</p>
                                        <p className="text-muted-foreground">{selectedUser.bankName} - {selectedUser.accountNumber} (a.n. {selectedUser.accountHolder})</p>
                                    </div>
                                </div>
                             </div>
                             <div>
                                <h4 className="font-medium mb-2">Penugasan Proyek</h4>
                                <div className="space-y-2">
                                    {selectedUser.projectAssignments?.map(pa => (
                                        <div key={pa.projectId} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                            <span className="font-medium">{projectsMap.get(pa.projectId) || 'Proyek tidak diketahui'}</span>
                                            <Badge variant="outline">{pa.salesCode}</Badge>
                                        </div>
                                    ))}
                                    {(!selectedUser.projectAssignments || selectedUser.projectAssignments.length === 0) && (
                                        <p className="text-xs text-muted-foreground text-center">Tidak ada penugasan proyek.</p>
                                    )}
                                </div>
                             </div>
                        </div>
                    )}
                    {selectedUser && selectedUser.status !== 'Menunggu Persetujuan' && (
                        <DialogFooter>
                            <Button
                                variant={selectedUser.status === 'Aktif' ? 'destructive' : 'default'}
                                onClick={handleToggleStatus}
                                disabled={isUpdating}
                            >
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {selectedUser.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
