
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { useCollection, useFirestore } from "@/firebase"
import { collection } from "firebase/firestore"
import type { Project } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useMemo } from "react"


export function ProjectsTable() {
    const firestore = useFirestore();

    const projectsQuery = useMemo(() => firestore ? collection(firestore, "projects") : null, [firestore]);
    const { data: projects, loading } = useCollection<Project>(projectsQuery);
    
    const router = useRouter();
    
    const getBadgeVariant = (status: Project['status']) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Completed': return 'secondary';
            case 'On Hold': return 'destructive';
            default: return 'outline';
        }
    };

    const handleRowClick = (projectId: string) => {
        router.push(`/admin/projects/${projectId}`);
    };

    if (loading) {
        return <div>Loading projects...</div>
    }

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Project
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Assigned Sales</TableHead>
                        <TableHead>
                        <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {projects && projects.map((project) => (
                        <TableRow key={project.id} onClick={() => handleRowClick(project.id)} className="cursor-pointer">
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>
                                <Badge variant={getBadgeVariant(project.status)}>{project.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{project.assignedSalesCodes.join(', ')}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuItem>Assign Sales</DropdownMenuItem>
                                    <DropdownMenuItem>Delete</DropdownMenuItem>
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
