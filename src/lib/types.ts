
import { Timestamp } from "firebase/firestore";

export type ProjectAssignment = {
  projectId: string;
  salesCode: string;
}

export type AppUser = {
  id: string;
  uid: string;
  name: string;
  email: string | null;
  role: 'Admin' | 'SPV' | 'Sales';
  avatar: string;
  supervisorId?: string;
  projectAssignments?: ProjectAssignment[];
  status: 'Aktif' | 'Non Aktif' | 'Menunggu Persetujuan';
  [key: string]: any; 
};

export type Project = {
  id: string;
  name: string;
  status: 'Aktif' | 'Non Aktif';
  assignedSalesCodes: string[];
  reportHeaders?: string[];
  feeSpv?: number;
  feeSales?: number;
  appsScriptUrl?: string;
  lastSyncTime?: Timestamp;
  lastSyncStatus?: 'success' | 'error';
  lastSyncMessage?: string;
};

export type Sale = {
  id: string;
  salesCode: string;
  projectName: string;
  amount: number;
  date: string; // ISO 8601 format
};

// Report type is intentionally kept loose because the structure is dynamic
export type Report = {
  id: string;
  projectId: string; // To link back to the project
  [key: string]: any;
};
