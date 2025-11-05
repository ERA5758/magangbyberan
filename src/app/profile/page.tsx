
"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, User, Mail, Landmark, Phone, Home, Hash } from "lucide-react";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
            <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-sm text-muted-foreground">{value || 'N/A'}</p>
            </div>
        </div>
    )
}

export default function ProfilePage() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Profil Saya"
          description="Melihat detail informasi akun Anda."
        />
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-6 w-40 mx-auto mt-4" />
            <Skeleton className="h-4 w-48 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <div>Pengguna tidak ditemukan. Silakan login kembali.</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profil Saya"
        description="Melihat detail informasi akun Anda."
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-4xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                    <InfoRow icon={User} label="Peran" value={user.role} />
                    <InfoRow icon={Hash} label="NIK" value={user.nik} />
                    <InfoRow icon={Phone} label="No. HP" value={user.phone} />
                    <InfoRow icon={Home} label="Alamat" value={user.address} />
                </CardContent>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Informasi Bank</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                    <InfoRow icon={Landmark} label="Nama Bank" value={user.bankName} />
                    <InfoRow icon={Hash} label="Nomor Rekening" value={user.accountNumber} />
                    <InfoRow icon={User} label="Atas Nama" value={user.accountHolder} />
                </CardContent>
             </Card>
            
          </CardContent>
        </Card>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Informasi</AlertTitle>
          <AlertDescription>
            Detail profil ini tidak dapat diubah. Untuk melakukan perubahan, harap hubungi Administrator.
          </AlertDescription>
        </Alert>
      </div>

    </div>
  );
}
