
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
import { Info, User, Mail, Landmark, Phone, Home, Hash, Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth, useFirestore, useStorage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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
  const { user, loading, mutate } = useCurrentUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage || !firestore || !auth?.currentUser) {
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Update Firestore document
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, { avatar: downloadURL });

      // 3. Update Firebase Auth profile
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      
      // 4. Manually update local state via mutate to reflect changes instantly
      if (mutate) {
        mutate();
      }

      toast({
        title: "Sukses",
        description: "Foto profil Anda telah berhasil diperbarui.",
      });

    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({
        variant: "destructive",
        title: "Gagal Mengunggah",
        description: "Terjadi kesalahan saat mengubah foto profil. Silakan coba lagi."
      });
    } finally {
      setIsUploading(false);
    }
  };

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
            <div className="relative group">
                <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-4xl">
                    {user.name.charAt(0)}
                </AvatarFallback>
                </Avatar>
                <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-4 right-0 rounded-full h-8 w-8 bg-background/80 group-hover:bg-background transition-all"
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Camera className="h-4 w-4" />
                    )}
                    <span className="sr-only">Ubah foto profil</span>
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                />
            </div>
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
            Selain foto profil, detail lainnya hanya dapat diubah oleh Administrator untuk menjaga validitas data.
          </AlertDescription>
        </Alert>
      </div>

    </div>
  );
}
