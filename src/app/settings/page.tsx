
"use client";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Laptop } from "lucide-react";

function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <RadioGroup
            value={theme}
            onValueChange={setTheme}
            className="grid grid-cols-3 gap-2"
        >
            <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                    <Sun className="mb-2 h-5 w-5" />
                    Terang
                </Label>
            </div>
            <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                    <Moon className="mb-2 h-5 w-5" />
                    Gelap
                </Label>
            </div>
            <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                    <Laptop className="mb-2 h-5 w-5" />
                    Sistem
                </Label>
            </div>
        </RadioGroup>
    );
}


export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Pengaturan Akun"
        description="Kelola detail akun, preferensi keamanan, dan tampilan aplikasi."
      />
      <div className="grid gap-6 max-w-2xl">
        <Card>
            <CardHeader>
                <CardTitle>Tampilan</CardTitle>
                <CardDescription>
                    Pilih tema tampilan untuk aplikasi.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ThemeSwitcher />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Ubah Kata Sandi</CardTitle>
            <CardDescription>
                Untuk keamanan akun Anda, jangan bagikan kata sandi Anda dengan
                siapapun.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <ChangePasswordForm />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
