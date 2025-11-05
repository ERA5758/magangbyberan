
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
  } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirestore } from "@/firebase"
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once"
import { collection } from "firebase/firestore"
import type { AppUser } from "@/lib/types";
import { AddUserForm } from "./add-user-form";


export function UsersTable() {
    const firestore = useFirestore();
    const usersQuery = useMemo(() => firestore ? collection(firestore, "users") : null, [firestore]);
    const { data: users, loading } = useCollectionOnce<AppUser>(usersQuery);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    
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
            default: return 'outline';
        }
    };

    const handleRowClick = (user: AppUser) => {
        // TODO: Navigate to a user detail/edit page
        console.log("Navigating to user:", user.name);
    };


    if (loading) {
        return <div>Memuat pengguna...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
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
                        <AddUserForm onSuccess={() => setIsAddUserOpen(false)} />
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
                                <div className="flex flex-wrap gap-1">
                                    {user.projectAssignments && user.projectAssignments.map((pa) => (
                                        <Badge key={pa.projectId} variant="outline">{pa.salesCode}</Badge>
                                    ))}
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
                                    {user.status === 'Menunggu Persetujuan' && (
                                        <>
                                            <DropdownMenuItem>Setujui</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem>Ubah</DropdownMenuItem>
                                    <DropdownMenuItem>Hapus</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
