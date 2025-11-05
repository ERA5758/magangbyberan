
import { Timestamp } from "firebase/firestore";

export type AppUser = {
  id: string;
  uid: string;
  name: string;
  email: string | null;
  role: 'Admin' | 'SPV' | 'Sales';
  avatar: string;
  salesCode: string;
  supervisorId?: string;
  [key: string]: any; 
};

export type Project = {
  id: string;
  name: string;
  status: 'Active' | 'Completed' | 'On Hold';
  assignedSalesCodes: string[];
  reportHeaders?: string[];
};

export type Sale = {
  id: string;
  salesCode: string;
  projectName: string;
  amount: number;
  date: string; // ISO 8601 format
};

export type Report = {
  id: string;
  [key: string]: any;
};
