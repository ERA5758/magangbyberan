
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
import { useCollectionOnce } from "@/firebase/firestore/use-collection-once"
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


export function ProjectsTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
    const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const projectsQuery = useMemo(() => firestore ? collection(firestore, "projects") : null, [firestore]);
    const { data: projects, loading, error, setData: setProjects } = useCollectionOnce<Project>(projectsQuery);
    
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
                title: "Project Deleted",
                description: `Project "${projectToDelete.name}" has been successfully deleted.`,
            });
             // Manually remove the deleted project from the local state
            if (projects) {
                setProjects(projects.filter(p => p.id !== projectToDelete.id));
            }
        } catch (e) {
            console.error("Error deleting project:", e);
            toast({
                variant: "destructive",
                title: "Failed to Delete Project",
                description: "An unexpected error occurred. Please try again."
            })
        } finally {
            setIsDeleteDialogOpen(false);
            setProjectToDelete(null);
        }
    };


    if (loading) {
        return <div>Loading projects...</div>
    }

    if (error) {
        return <div>Error loading projects: {error.message}</div>
    }

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add New Project</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to create a new project.
                            </DialogDescription>
                        </DialogHeader>
                        <AddProjectForm onSuccess={() => {
                            // Manually refetching might be needed if useCollectionOnce doesn't update
                            // For now, let's assume parent re-render or manual state update will handle it.
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
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Report Headers</TableHead>
                        <TableHead>
                        <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {projects && projects.map((project, index) => (
                        <TableRow key={project.id} onClick={() => handleRowClick(project.id)} className="cursor-pointer">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>
                                <Badge variant={getBadgeVariant(project.status)}>{project.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                    {project.reportHeaders && project.reportHeaders.length > 0 ? (
                                        project.reportHeaders.slice(0, 5).map(header => (
                                            <Badge key={header} variant="outline" className="text-xs">{header}</Badge>
                                        ))
                                    ) : (
                                         <span className="text-muted-foreground text-xs">Not Configured</span>
                                    )}
                                    {project.reportHeaders && project.reportHeaders.length > 5 && (
                                        <Badge variant="outline" className="text-xs">...</Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={(e) => handleEditClick(e, project)}>
                                        Edit Project
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        onClick={(e) => handleDeleteClick(e, project)}
                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    >
                                        Delete Project
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
                            <DialogTitle>Edit Project: {selectedProject.name}</DialogTitle>
                            <DialogDescription>
                                Update the details for this project.
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
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the 
                        <span className="font-semibold"> {projectToDelete?.name} </span> 
                        project and all of its associated data.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
