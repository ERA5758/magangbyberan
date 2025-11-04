
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useMemo } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { createUserWithEmailAndPassword, AuthErrorCodes } from 'firebase/auth';
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

const formSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi.'),
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
  role: z.enum(['Admin', 'SPV', 'Sales']),
  supervisor: z.string().optional(),
  nik: z.string().min(1, 'NIK harus diisi.'),
  address: z.string().min(1, 'Alamat harus diisi.'),
  phone: z.string().min(1, 'No. HP harus diisi.'),
  bankName: z.string().min(1, 'Nama Bank harus diisi.'),
  accountNumber: z.string().min(1, 'Nomor Rekening harus diisi.'),
  accountHolder: z.string().min(1, 'Nama Rekening harus diisi.'),
  project: z.string().optional(),
  salesCode: z.string().min(1, 'Kode Sales harus diisi.'),
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

  const supervisorsQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'users'), where('role', '==', 'SPV')) : null
  , [firestore]);
  const { data: supervisors } = useCollection<AppUser>(supervisorsQuery);
  
  const projectsQuery = useMemo(() => 
    firestore ? collection(firestore, 'projects') : null
  , [firestore]);
  const { data: projects } = useCollection<Project>(projectsQuery);

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
      salesCode: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Firebase not initialized',
        description: 'Firebase is not ready, please try again later.',
      });
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. ONLY if Auth creation is successful, create user document in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const userData: Omit<AppUser, 'uid' | 'avatar' | 'id'> & { [key: string]: any } = {
        name: values.name,
        email: values.email,
        role: values.role,
        salesCode: values.salesCode,
        nik: values.nik,
        address: values.address,
        phone: values.phone,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountHolder: values.accountHolder,
        createdAt: new Date().toISOString(),
      };

      if (values.supervisor) {
        userData.supervisorId = values.supervisor;
      }
      
      if (values.project) {
        userData.projectId = values.project;
      }

      await setDoc(userDocRef, userData);

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
      if (error.code) {
        switch (error.code) {
          case AuthErrorCodes.EMAIL_EXISTS:
            description = 'Alamat email ini sudah digunakan oleh akun lain.';
            break;
          case AuthErrorCodes.WEAK_PASSWORD:
            description = 'Kata sandi terlalu lemah. Harap gunakan minimal 6 karakter.';
            break;
          case AuthErrorCodes.INVALID_EMAIL:
            description = 'Format alamat email tidak valid.';
            break;
          default:
            description = `Terjadi galat: ${error.message}`;
        }
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
            name="supervisor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih supervisor...</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!supervisors || supervisors.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih supervisor..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {supervisors?.map(spv => (
                         <SelectItem key={spv.uid} value={spv.uid}>{spv.name}</SelectItem>
                    ))}
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
           <FormField
            control={form.control}
            name="project"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih Proyek</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!projects || projects.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih proyek..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects?.map(proj => (
                         <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salesCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Sales</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: SLS04" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
