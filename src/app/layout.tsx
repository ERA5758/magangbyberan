
"use client";

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import AppLogo from "@/components/shared/app-logo";
import { UserNav } from "@/components/shared/user-nav";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  UsersRound,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { usePathname, useRouter, useSelectedLayoutSegment } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Array<'Admin' | 'SPV' | 'Sales'>;
};

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dasbor', icon: LayoutDashboard, roles: ['Admin'] },
  { href: '/spv', label: 'Dasbor', icon: LayoutDashboard, roles: ['SPV'] },
  { href: '/sales', label: 'Dasbor', icon: LayoutDashboard, roles: ['Sales'] },
  { href: '/admin/users', label: 'Pengguna', icon: Users, roles: ['Admin'] },
  { href: '/admin/projects', label: 'Proyek', icon: Briefcase, roles: ['Admin'] },
  { href: '/admin/reports', label: 'Laporan', icon: ClipboardList, roles: ['Admin'] },
  { href: '/spv/team', label: 'Tim Saya', icon: UsersRound, roles: ['SPV'] },
  { href: '/spv/reports', label: 'Laporan', icon: ClipboardList, roles: ['SPV'] },
  { href: '/sales/reports', label: 'Laporan', icon: ClipboardList, roles: ['Sales'] },
];

const bottomNavItems = [
    { href: '/settings', label: 'Pengaturan', icon: Settings, roles: ['Admin', 'SPV', 'Sales'] as const },
];


function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (loading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="mb-4 flex flex-col items-center gap-2">
                  <AppLogo className="h-8 w-auto text-primary" />
                  <p className="text-sm text-muted-foreground font-semibold">Bangun Karier, Mulai Dari Magang</p>
                </div>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Memuat dasbor Anda...</p>
            </div>
        </div>
    );
  }

  const filteredNavItems = navItems.filter(item => user.role && item.roles.includes(user.role));
  const filteredBottomNavItems = bottomNavItems.filter(item => user.role && item.roles.includes(user.role));

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <AppLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {filteredNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {filteredBottomNavItems.map((item) => (
               <SidebarMenuItem key={item.href}>
                 <Link href={item.href} passHref>
                   <SidebarMenuButton
                     isActive={pathname.startsWith(item.href)}
                     tooltip={item.label}
                   >
                     <item.icon />
                     <span>{item.label}</span>
                   </SidebarMenuButton>
                 </Link>
               </SidebarMenuItem>
            ))}
             <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip="Keluar">
                    <LogOut />
                    <span>Keluar</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
             {/* Can be used for breadcrumbs or page title */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const segment = useSelectedLayoutSegment();
  const isAppRoute = segment !== 'login';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Magang By BERAN</title>
        <meta name="description" content="Platform Agregasi Data Penjualan" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider>
          <FirebaseClientProvider>
            {isAppRoute ? <AppLayout>{children}</AppLayout> : children}
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
