
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";
import { useAuth, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { AppUser } from "@/hooks/use-current-user";

const formSchema = z.object({
  email: z.string().email({ message: "Harap masukkan email yang valid." }),
  password: z.string().min(1, { message: "Kata sandi harus diisi." }),
});

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Firebase tidak terinisialisasi",
        description: "Firebase belum siap, harap coba lagi nanti.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as AppUser;

        if (userData.status === 'Non Aktif' || userData.status === 'Menunggu Persetujuan') {
          await auth.signOut();
          const reason = userData.status === 'Non Aktif' 
            ? "Akun Anda tidak aktif. Harap hubungi administrator."
            : "Akun Anda sedang menunggu persetujuan dari Admin.";
          toast({
            variant: "destructive",
            title: "Login Gagal",
            description: reason,
          });
          setIsLoading(false);
          return;
        }

        const userRole = userData.role; 

        toast({
            title: "Login Berhasil",
            description: `Selamat datang kembali, ${userData.name}! Mengalihkan...`,
        });
        
        switch (userRole) {
          case 'Admin':
            router.push('/admin');
            break;
          case 'SPV':
            router.push('/spv');
            break;
          case 'Sales':
            router.push('/sales');
            break;
          default:
            toast({
              variant: "destructive",
              title: "Peran tidak ditemukan",
              description: "Peran pengguna tidak ditentukan. Harap hubungi dukungan.",
            });
            await auth.signOut();
            router.push('/login');
        }

      } else {
        await auth.signOut();
        throw new Error("Data pengguna tidak ditemukan. Harap hubungi dukungan.");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      let description = "Terjadi kesalahan tak terduga. Silakan coba lagi.";
      if (error.code) {
        switch (error.code) {
          case AuthErrorCodes.INVALID_CREDENTIAL:
          case "auth/user-not-found":
          case "auth/wrong-password":
            description = "Email atau kata sandi tidak valid. Harap periksa kembali dan coba lagi.";
            break;
          default:
            description = `Terjadi kesalahan: ${error.message}`;
        }
      }
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: description,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Selamat Datang Kembali</CardTitle>
        <CardDescription>Masukkan kredensial Anda untuk mengakses dasbor.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="nama@contoh.com" {...field} />
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    