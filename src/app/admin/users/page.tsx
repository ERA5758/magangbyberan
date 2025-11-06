
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { UsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFirestore } from "@/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import type { AppUser } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function UsersPage() {
  const firestore = useFirestore();
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const usersQuery = useMemo(() => firestore ? query(collection(firestore, "users")) : null, [firestore]);

  const fetchUsers = useCallback(async () => {
    if (!usersQuery) {
        setUsers([]);
        setLoading(false);
        return;
    };
    setLoading(true);
    try {
        const snapshot = await getDocs(usersQuery);
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
        setUsers(usersData);
    } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
    } finally {
        setLoading(false);
    }
  }, [usersQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const filteredUsers = useMemo(() => {
    if (!users) return null;
    if (!searchQuery) return users;

    const lowercasedQuery = searchQuery.toLowerCase();
    return users.filter(user => 
        user.name.toLowerCase().includes(lowercasedQuery) ||
        user.email?.toLowerCase().includes(lowercasedQuery)
    );
  }, [users, searchQuery]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manajemen Pengguna"
        description="Lihat, tambah, atau kelola semua pengguna di platform."
      />
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Semua Pengguna</CardTitle>
            <CardDescription>
              Daftar semua pengguna dalam sistem. Klik 'Tambah Pengguna' untuk membuat yang baru.
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Cari pengguna..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <UsersTable users={filteredUsers} loading={loading} mutate={fetchUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
