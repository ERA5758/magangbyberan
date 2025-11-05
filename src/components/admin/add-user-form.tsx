
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useMemo } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { useCollectionOnce } from '@/firebase/firestore/use-collection-once';
import { doc, setDoc, collection, query, where } from 'firebase/firestore';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { AppUser, Project } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { AuthErrorCodes } from 'firebase/auth';

const projectAssignmentSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  assigned: z.boolean(),
  salesCode: z.string(),
});

const formSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi.'),
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
  role: z.enum(['Admin', 'SPV', 'Sales']),
  nik: z.string().min(1, 'NIK harus diisi.'),
  address: z.string().min(1, 'Alamat harus diisi.'),
  phone: z.string().min(1, 'No. HP harus diisi.'),
  bankName: z.string().min(1, 'Nama Bank harus diisi.'),
  accountNumber: z.string().min(1, 'Nomor Rekening harus diisi.'),
  accountHolder: z.string().min(1, 'Nama Rekening harus diisi.'),
  projectAssignments: z.array(projectAssignmentSchema),
});

type AddUserFormProps = {
  onSuccess?: () => void;
};

export function AddUserForm({ onSuccess }: AddUserFormProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const projectsQuery = useMemo(() => 
    firestore ? collection(firestore, 'projects') : null
  , [firestore]);
  const { data: projects, loading: projectsLoading } = useCollectionOnce<Project>(projectsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Sales',
      nik: '',
      address: '',
      phone: '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      projectAssignments: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "projectAssignments",
  });

  useMemo(() => {
    if (projects) {
      const assignments = projects.map(p => ({
        projectId: p.id,
        projectName: p.name,
        assigned: false,
        salesCode: ''
      }));
      replace(assignments);
    }
  }, [projects, replace]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Firebase tidak terinisialisasi',
        description: 'Firebase belum siap, silakan coba lagi nanti.',
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const assignedProjects = values.projectAssignments
        .filter(p => p.assigned)
        .map(p => {
            if (!p.salesCode) {
                throw new Error(`Kode sales untuk proyek ${p.projectName} harus diisi.`);
            }
            return {
                projectId: p.projectId,
                salesCode: p.salesCode,
            }
        });

      if (values.role === 'Sales' && assignedProjects.length === 0) {
          toast({
              variant: 'destructive',
              title: 'Penugasan Proyek Diperlukan',
              description: 'Harap tetapkan setidaknya satu proyek dan berikan kode sales.',
          });
          setIsLoading(false);
          return;
      }
      
      const userData: Omit<AppUser, 'uid' | 'avatar' | 'id'> & { [key: string]: any } = {
        name: values.name,
        email: values.email,
        role: values.role,
        status: 'Aktif', // Admin creates active users directly
        nik: values.nik,
        address: values.address,
        phone: values.phone,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountHolder: values.accountHolder,
        createdAt: new Date().toISOString(),
        projectAssignments: values.role === 'Sales' ? assignedProjects : [],
      };
      
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            password: values.password,
            ...userData
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat pengguna.');
      }
      
      toast({
        title: 'Pengguna Berhasil Dibuat',
        description: `${values.name} telah ditambahkan sebagai ${values.role}.`,
      });
      
      form.reset();
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Error creating user:', error);
      let description = 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';
      // Use includes to catch specific error messages from the server
      if (error.message.includes('EMAIL_EXISTS')) {
          description = 'Alamat email ini sudah digunakan oleh akun lain.';
      } else if (error.message.includes('WEAK_PASSWORD')) {
          description = 'Kata sandi terlalu lemah. Harap gunakan minimal 6 karakter.';
      } else if (error.message) {
          description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Gagal Membuat Pengguna',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const role = form.watch('role');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kata Sandi</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peran</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih peran..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="SPV">SPV</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK</FormLabel>
                <FormControl>
                  <Input placeholder="Nomor Induk Kependudukan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                  <Input placeholder="Alamat Lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No. HP</FormLabel>
                <FormControl>
                  <Input placeholder="08123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Bank</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: BCA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Rekening</FormLabel>
                <FormControl>
                  <Input placeholder="1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountHolder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Rekening</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Sesuai Rekening" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {role === 'Sales' && (
          <Card>
            <CardHeader>
              <CardTitle>Penugasan Proyek</CardTitle>
              <CardDescription>Pilih proyek dan tetapkan kode sales unik untuk masing-masing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectsLoading ? <p>Memuat proyek...</p> : 
                fields.map((item, index) => {
                  const isChecked = form.watch(`projectAssignments.${index}.assigned`);
                  return (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-3 rounded-md border">
                    <FormField
                      control={form.control}
                      name={`projectAssignments.${index}.assigned`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal w-32 sm:w-40 whitespace-nowrap overflow-hidden text-ellipsis">
                           {item.projectName}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`projectAssignments.${index}.salesCode`}
                      render={({ field }) => (
                        <FormItem className="flex-1 w-full">
                          <FormControl>
                            <Input placeholder="Masukkan Kode Sales" {...field} disabled={!isChecked} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )})
              }
            </CardContent>
          </Card>
        )}


        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tambah Pengguna
          </Button>
        </div>
      </form>
    </Form>
  );
}
