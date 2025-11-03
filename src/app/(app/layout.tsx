"use client";

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
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useEffect } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Array<'Admin' | 'SPV' | 'Sales'>;
};

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin'] },
  { href: '/spv', label: 'Dashboard', icon: LayoutDashboard, roles: ['SPV'] },
  { href: '/sales', label: 'Dashboard', icon: LayoutDashboard, roles: ['Sales'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['Admin'] },
  { href: '/admin/projects', label: 'Projects', icon: Briefcase, roles: ['Admin'] },
  { href: '/spv/team', label: 'My Team', icon: UsersRound, roles: ['SPV'] },
];

const bottomNavItems = [
    { href: '/settings', label: 'Settings', icon: Settings, roles: ['Admin', 'SPV', 'Sales'] as const },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
  }

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

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
                <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                    <LogOut />
                    <span>Logout</span>
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
