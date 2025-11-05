
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
  name: z.string().min(1, 'Nama proyek harus diisi.'),
  status: z.enum(['Aktif', 'Non Aktif']),
  reportHeaders: z.string().optional(),
  feeSpv: z.coerce.number().optional(),
  feeSales: z.coerce.number().optional(),
});

type AddProjectFormProps = {
  onSuccess?: () => void;
};

export function AddProjectForm({ onSuccess }: AddProjectFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      status: 'Aktif',
      reportHeaders: '',
      feeSpv: 0,
      feeSales: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Firebase tidak terinisialisasi',
        description: 'Firestore belum siap, silakan coba lagi nanti.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const projectsCollection = collection(firestore, 'projects');
      
      const headers = values.reportHeaders
        ? values.reportHeaders.split(',').map(h => h.trim()).filter(h => h)
        : [];

      await addDoc(projectsCollection, {
        name: values.name,
        status: values.status,
        assignedSalesCodes: [],
        reportHeaders: headers,
        feeSpv: values.feeSpv || 0,
        feeSales: values.feeSales || 0,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Proyek Dibuat',
        description: `Proyek "${values.name}" telah berhasil dibuat.`,
      });

      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Membuat Proyek',
        description: 'Terjadi kesalahan tak terduga. Silakan coba lagi.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Proyek</FormLabel>
              <FormControl>
                <Input placeholder="cth., Proyek Alpha" {...field} />
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
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Non Aktif">Non Aktif</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="feeSpv"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee SPV</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feeSales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Sales</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="reportHeaders"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Header Laporan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="ID UNIK, Nama Merchant, STATUS_PROSES, PIC..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Masukkan header kolom yang ingin ditampilkan, dipisahkan dengan koma.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Proyek
          </Button>
        </div>
      </form>
    </Form>
  );
}
