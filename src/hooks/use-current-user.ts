"use client"
import { useState, useEffect } from 'react';
import { users, type User } from '@/lib/mock-data';

// This is a mock hook. In a real app, you'd get this from your auth context.
export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // In a real app, you'd have an auth state listener.
    // Here we use localStorage to persist the selected user role for demo purposes.
    const storedRole = localStorage.getItem('currentUserRole') || 'Sales';
    const user = users.find(u => u.role === storedRole);
    setCurrentUser(user || users.find(u => u.role === 'Sales')!);
  }, []);

  const setUserRole = (role: 'Admin' | 'SPV' | 'Sales') => {
    localStorage.setItem('currentUserRole', role);
    const user = users.find(u => u.role === role);
    setCurrentUser(user || users.find(u => u.role === 'Sales')!);
    // A full page reload might be needed to reflect changes in layouts if not using a state manager
    window.location.reload();
  };

  return { user: currentUser, setUserRole };
};
