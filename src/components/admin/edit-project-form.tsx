
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  status: z.enum(['Active', 'Completed', 'On Hold']),
  reportHeaders: z.string().optional(),
});

type EditProjectFormProps = {
  project: Project;
  onSuccess?: () => void;
};

export function EditProjectForm({ project, onSuccess }: EditProjectFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      status: 'Active',
      reportHeaders: '',
    },
  });
  
  useEffect(() => {
    if (project) {
        form.reset({
            name: project.name,
            status: project.status,
            reportHeaders: project.reportHeaders ? project.reportHeaders.join(', ') : '',
        });
    }
  }, [project, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Firebase not initialized',
      });
      setIsLoading(false);
      return;
    }

    try {
      const projectRef = doc(firestore, 'projects', project.id);
      
      const headers = values.reportHeaders
        ? values.reportHeaders.split(',').map(h => h.trim()).filter(h => h)
        : [];

      await updateDoc(projectRef, {
        name: values.name,
        status: values.status,
        reportHeaders: headers,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Project Updated',
        description: `Project "${values.name}" has been successfully updated.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Update Project',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Project Alpha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reportHeaders"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Headers</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="ID UNIK, Merchant Name, STATUS_PROCESS, PIC..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the column headers you want to display, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
