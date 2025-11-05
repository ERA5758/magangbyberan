
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const formSchema = z.object({
  usersCsv: z.any().refine(files => files?.length === 1, 'File CSV harus diunggah.'),
});

type BulkImportResult = {
    totalRows: number;
    successCount: number;
    errorCount: number;
    errors: { row: number, reason: string }[];
}

export function BulkImportUsersForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleDownloadTemplate = () => {
    const header = "name,email,password,role,nik,address,phone,bankName,accountNumber,accountHolder,supervisorId,projectAssignments\n";
    const exampleRow = "John Doe,john.doe@example.com,password123,Sales,1234567890123456,123 Main St,08123456789,BCA,1234567890,John Doe,spv_user_id_1,project_id_1:SALES01;project_id_2:SALES02\n";
    const exampleRow2 = "Jane Smith,jane.smith@example.com,password456,SPV,6543210987654321,456 Oak Ave,08987654321,Mandiri,0987654321,Jane Smith,,\n";
    const csvContent = header + exampleRow + exampleRow2;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "template_pengguna.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setImportResult(null);

    const currentUser = auth?.currentUser;
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Otentikasi Diperlukan' });
        setIsLoading(false);
        return;
    }

    try {
        const idToken = await currentUser.getIdToken();
        const formData = new FormData();
        formData.append('file', values.usersCsv[0]);
        
        const response = await fetch('/api/bulk-create-users', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${idToken}`,
            },
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Gagal mengimpor pengguna.');
        }

        setImportResult(result);
        toast({
            title: 'Impor Selesai',
            description: `Berhasil memproses ${result.successCount} dari ${result.totalRows} pengguna.`,
        });

        if (onSuccess && result.errorCount === 0) {
            onSuccess();
        }

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Gagal Mengimpor Pengguna',
            description: error.message || 'Terjadi kesalahan yang tidak terduga.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Alert>
             <Download className="h-4 w-4" />
            <AlertTitle>Unduh Template</AlertTitle>
            <AlertDescription>
                Unduh dan isi template CSV untuk memastikan format data yang benar. Kolom `supervisorId` hanya wajib untuk peran 'Sales'. Kolom `projectAssignments` diisi dengan format `projectId:salesCode` dan dipisahkan dengan titik koma (`;`) jika lebih dari satu.
                <Button variant="link" type="button" onClick={handleDownloadTemplate} className="p-0 h-auto ml-1">Unduh di sini.</Button>
            </AlertDescription>
          </Alert>
          <FormField
            control={form.control}
            name="usersCsv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File CSV Pengguna</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept=".csv"
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Impor Pengguna
            </Button>
          </div>
        </form>
      </Form>
      {importResult && (
        <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Hasil Impor</h3>
            <div className="flex gap-4">
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Berhasil</AlertTitle>
                    <AlertDescription>{importResult.successCount} pengguna berhasil dibuat.</AlertDescription>
                </Alert>
                <Alert variant={importResult.errorCount > 0 ? "destructive" : "default"}>
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Gagal</AlertTitle>
                    <AlertDescription>{importResult.errorCount} pengguna gagal dibuat.</AlertDescription>
                </Alert>
            </div>
            {importResult.errors.length > 0 && (
                 <div className="max-h-40 overflow-y-auto rounded-md border p-4 text-sm">
                    <p className="font-medium mb-2">Detail Kegagalan:</p>
                    <ul className="space-y-1">
                        {importResult.errors.map((err, i) => (
                            <li key={i}>
                                <span className="font-semibold">Baris {err.row}:</span> {err.reason}
                            </li>
                        ))}
                    </ul>
                 </div>
            )}
        </div>
      )}
    </>
  );
}
