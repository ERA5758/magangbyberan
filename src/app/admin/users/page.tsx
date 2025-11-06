
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

export default function UsersPage() {
  const firestore = useFirestore();
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manajemen Pengguna"
        description="Lihat, tambah, atau kelola semua pengguna di platform."
      />
      <Card>
        <CardHeader>
          <CardTitle>Semua Pengguna</CardTitle>
          <CardDescription>
            Daftar semua pengguna dalam sistem. Klik 'Tambah Pengguna' untuk membuat yang baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} loading={loading} mutate={fetchUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
