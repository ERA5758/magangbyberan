
"use client"

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { useFirestore } from "@/firebase"
import { useCollection } from "@/firebase/firestore/use-collection"
import { collection, deleteDoc, doc } from "firebase/firestore"
import type { Project } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { AddProjectForm } from "./add-project-form"
import { EditProjectForm } from "./edit-project-form"
import { useToast } from "@/hooks/use-toast"

const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function ProjectsTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
    const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const projectsQuery = useMemo(() => firestore ? collection(firestore, "projects") : null, [firestore]);
    const { data: projects, loading, error } = useCollection<Project>(projectsQuery);
    
    const router = useRouter();
    
    const getBadgeVariant = (status: Project['status']) => {
        switch (status) {
            case 'Aktif': return 'default';
            case 'Non Aktif': return 'destructive';
            default: return 'outline';
        }
    };

    const handleRowClick = (projectId: string) => {
        router.push(`/admin/projects/${projectId}`);
    };
    
    const handleEditClick = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setSelectedProject(project);
        setIsEditProjectOpen(true);
    }
    
    const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setProjectToDelete(project);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!projectToDelete || !firestore) return;
        try {
            await deleteDoc(doc(firestore, "projects", projectToDelete.id));
            toast({
                title: "Proyek Dihapus",
                description: `Proyek "${projectToDelete.name}" telah berhasil dihapus.`,
            });
        } catch (e) {
            console.error("Error deleting project:", e);
            toast({
                variant: "destructive",
                title: "Gagal Menghapus Proyek",
                description: "Terjadi kesalahan tak terduga. Silakan coba lagi."
            })
        } finally {
            setIsDeleteDialogOpen(false);
            setProjectToDelete(null);
        }
    };


    if (loading) {
        return <div>Memuat proyek...</div>
    }

    if (error) {
        return <div>Terjadi galat saat memuat proyek: {error.message}</div>
    }

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Proyek
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Tambah Proyek Baru</DialogTitle>
                            <DialogDescription>
                                Isi detail di bawah ini untuk membuat proyek baru.
                            </DialogDescription>
                        </DialogHeader>
                        <AddProjectForm onSuccess={() => {
                            setIsAddProjectOpen(false);
                        }} />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">No.</TableHead>
                        <TableHead>Nama Proyek</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fee SPV</TableHead>
                        <TableHead>Fee Sales</TableHead>
                        <TableHead className="hidden lg:table-cell">Header Laporan</TableHead>
                        <TableHead>
                            <span className="sr-only">Aksi</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {projects && projects.map((project, index) => (
                        <TableRow key={project.id} onClick={() => handleRowClick(project.id)} className="cursor-pointer">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">
                                {project.name}
                            </TableCell>
                            <TableCell>
                                <Badge variant={getBadgeVariant(project.status)}>{project.status}</Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(project.feeSpv)}</TableCell>
                            <TableCell>{formatCurrency(project.feeSales)}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                    {project.reportHeaders && project.reportHeaders.length > 0 ? (
                                        project.reportHeaders.slice(0, 3).map(header => (
                                            <Badge key={header} variant="outline" className="text-xs">{header}</Badge>
                                        ))
                                    ) : (
                                         <span className="text-muted-foreground text-xs">Belum Dikonfigurasi</span>
                                    )}
                                    {project.reportHeaders && project.reportHeaders.length > 3 && (
                                        <Badge variant="outline" className="text-xs">...</Badge>
                                    )}
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
                                        <DropdownMenuItem onClick={(e) => handleEditClick(e, project)}>
                                            Ubah Proyek
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            onClick={(e) => handleDeleteClick(e, project)}
                                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                        >
                                            Hapus Proyek
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
            {selectedProject && (
                 <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Ubah Proyek: {selectedProject.name}</DialogTitle>
                            <DialogDescription>
                                Perbarui detail untuk proyek ini.
                            </DialogDescription>
                        </DialogHeader>
                        <EditProjectForm project={selectedProject} onSuccess={() => {
                            setIsEditProjectOpen(false);
                            setSelectedProject(null);
                        }} />
                    </DialogContent>
                </Dialog>
            )}
             <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus secara permanen proyek 
                        <span className="font-semibold"> {projectToDelete?.name} </span> 
                        dan semua data terkaitnya.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                        Hapus
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
