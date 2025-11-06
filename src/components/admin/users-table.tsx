
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle, User, Mail, Landmark, Phone, Home, Loader2, Upload, UserCog, UserSquare, Hash } from "lucide-react"
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

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
            <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-sm text-muted-foreground break-words">{value || 'N/A'}</p>
            </div>
        </div>
    )
}

export function UsersTable({ users, loading, mutate }: UsersTableProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const projectsQuery = useMemo(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
    const { data: projects, loading: projectsLoading } = useCollectionOnce<Project>(projectsQuery);

    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const projectsMap = useMemo(() => {
        if (!projects) return new Map();
        return new Map(projects.map(p => [p.id, p.name]));
    }, [projects]);
    
    const supervisorsMap = useMemo(() => {
        if (!users) return new Map();
        const spvs = users.filter(u => u.role === 'SPV');
        return new Map(spvs.map(s => [s.id, s.name]));
    }, [users]);


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

    const handleApprove = async () => {
        if (!selectedUser || !firestore) return;
        setIsUpdating(true);
        const userRef = doc(firestore, 'users', selectedUser.id);
        try {
            await updateDoc(userRef, { status: 'Aktif' });
            toast({ title: 'Pengguna Disetujui', description: `${selectedUser.name} sekarang aktif.` });
            mutate();
            setIsDetailOpen(false);
        } catch (err) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyetujui pengguna.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const openDeleteDialog = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedUser || !firestore) return;
        setIsUpdating(true);
        const userRef = doc(firestore, 'users', selectedUser.id);
        try {
            await deleteDoc(userRef);
            toast({ title: 'Pengguna Dihapus', description: `Data untuk ${selectedUser.name} telah dihapus.` });
            mutate();
            setIsDetailOpen(false);
        } catch (err) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus pengguna.' });
        } finally {
            setIsUpdating(false);
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
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
                        <TableHead>Pengguna</TableHead>
                        <TableHead className="hidden sm:table-cell">Peran</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Proyek & Kode Sales</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users && users.map((user) => (
                        <TableRow key={user.id} onClick={() => handleRowClick(user)} className="cursor-pointer">
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
                            <TableCell className="hidden sm:table-cell">
                                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                            </TableCell>
                             <TableCell>
                                <Badge variant={getStatusBadgeVariant(user.status)}>{user.status || 'Aktif'}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                    {user.projectAssignments && user.projectAssignments.map((pa) => (
                                        <Badge key={pa.projectId} variant="outline" title={projectsMap.get(pa.projectId) || pa.projectId}>{pa.salesCode}</Badge>
                                    ))}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
             <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14">
                                <AvatarImage src={selectedUser?.avatar} alt={selectedUser?.name} />
                                <AvatarFallback className="text-2xl">{selectedUser?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <DialogTitle>{selectedUser?.name}</DialogTitle>
                                <DialogDescription>{selectedUser?.email}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 py-4">
                             <div className="space-y-3 rounded-md border border-dashed p-3">
                                 <InfoRow icon={UserCog} label="Peran" value={selectedUser.role} />
                                 <InfoRow icon={UserSquare} label="Status" value={selectedUser.status} />
                                 {selectedUser.role === 'Sales' && (
                                     <InfoRow icon={User} label="Supervisor" value={supervisorsMap.get(selectedUser.supervisorId || '')} />
                                 )}
                             </div>
                             <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground">Informasi Pribadi</h4>
                                <InfoRow icon={Hash} label="NIK" value={selectedUser.nik} />
                                <InfoRow icon={Phone} label="No. HP" value={selectedUser.phone} />
                                <InfoRow icon={Home} label="Alamat" value={selectedUser.address} />
                             </div>
                             <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground">Informasi Bank</h4>
                                <InfoRow icon={Landmark} label="Bank" value={`${selectedUser.bankName} - ${selectedUser.accountNumber} (a.n. ${selectedUser.accountHolder})`} />
                             </div>
                             <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Penugasan Proyek</h4>
                                <div className="space-y-2">
                                    {selectedUser.projectAssignments?.map(pa => (
                                        <div key={pa.projectId} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                            <span className="font-medium">{projectsMap.get(pa.projectId) || 'Proyek tidak diketahui'}</span>
                                            <Badge variant="outline">{pa.salesCode}</Badge>
                                        </div>
                                    ))}
                                    {(!selectedUser.projectAssignments || selectedUser.projectAssignments.length === 0) && (
                                        <p className="text-xs text-muted-foreground text-center py-2">Tidak ada penugasan proyek.</p>
                                    )}
                                </div>
                             </div>
                        </div>
                    )}
                     <DialogFooter className="gap-2 sm:justify-between">
                        {selectedUser?.status === 'Menunggu Persetujuan' && (
                            <div className="flex-1 flex gap-2">
                                <Button variant="destructive" onClick={openDeleteDialog} disabled={isUpdating} className="w-full">
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Tolak
                                </Button>
                                <Button variant="default" onClick={handleApprove} disabled={isUpdating} className="w-full">
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Setujui
                                </Button>
                            </div>
                        )}
                        {selectedUser?.status !== 'Menunggu Persetujuan' && (
                            <>
                                <Button variant="destructive" onClick={openDeleteDialog} disabled={isUpdating}>
                                    Hapus Pengguna
                                </Button>
                                <Button
                                    variant={selectedUser?.status === 'Aktif' ? 'secondary' : 'default'}
                                    onClick={handleToggleStatus}
                                    disabled={isUpdating}
                                >
                                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {selectedUser?.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus secara permanen pengguna 
                        <span className="font-semibold"> {selectedUser?.name} </span> 
                        dan semua data terkaitnya.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedUser(null)}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Hapus
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )

    

    