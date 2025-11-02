import { PlaceHolderImages } from '@/lib/placeholder-images';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'SPV' | 'Sales';
  avatar: string;
  salesCode: string;
};

export type Project = {
  id: string;
  name: string;
  status: 'Active' | 'Completed' | 'On Hold';
  assignedSalesCodes: string[];
};

export type Sale = {
  id: string;
  salesCode: string;
  projectName: string;
  amount: number;
  date: string;
};

export const users: User[] = [
  { id: 'usr_admin', name: 'Admin User', email: 'admin@beran.co', role: 'Admin', avatar: PlaceHolderImages.find(p => p.id === 'user1')?.imageUrl || '', salesCode: 'ADM01' },
  { id: 'usr_spv', name: 'Supervisor', email: 'spv@beran.co', role: 'SPV', avatar: PlaceHolderImages.find(p => p.id === 'user2')?.imageUrl || '', salesCode: 'SPV01' },
  { id: 'usr_sales1', name: 'Jane Doe', email: 'jane.d@beran.co', role: 'Sales', avatar: PlaceHolderImages.find(p => p.id === 'user3')?.imageUrl || '', salesCode: 'SLS01' },
  { id: 'usr_sales2', name: 'John Smith', email: 'john.s@beran.co', role: 'Sales', avatar: PlaceHolderImages.find(p => p.id === 'user4')?.imageUrl || '', salesCode: 'SLS02' },
  { id: 'usr_sales3', name: 'Sam Wilson', email: 'sam.w@beran.co', role: 'Sales', avatar: PlaceHolderImages.find(p => p.id === 'user5')?.imageUrl || '', salesCode: 'SLS03' },
];

export const projects: Project[] = [
  { id: 'proj_alpha', name: 'Project Alpha', status: 'Active', assignedSalesCodes: ['SLS01', 'SLS02'] },
  { id: 'proj_beta', name: 'Project Beta', status: 'Active', assignedSalesCodes: ['SLS03'] },
  { id: 'proj_gamma', name: 'Project Gamma', status: 'Completed', assignedSalesCodes: ['SLS01'] },
  { id: 'proj_delta', name: 'Project Delta', status: 'On Hold', assignedSalesCodes: ['SLS02', 'SLS03'] },
];

export const sales: Sale[] = [
  { id: 'sale_001', salesCode: 'SLS01', projectName: 'Project Alpha', amount: 1500, date: '2024-07-15' },
  { id: 'sale_002', salesCode: 'SLS02', projectName: 'Project Alpha', amount: 2200, date: '2024-07-14' },
  { id: 'sale_003', salesCode: 'SLS01', projectName: 'Project Gamma', amount: 3000, date: '2024-07-13' },
  { id: 'sale_004', salesCode: 'SLS03', projectName: 'Project Beta', amount: 1800, date: '2024-07-12' },
  { id: 'sale_005', salesCode: 'SLS02', projectName: 'Project Delta', amount: 950, date: '2024-07-11' },
  { id: 'sale_006', salesCode: 'SLS01', projectName: 'Project Alpha', amount: 1600, date: '2024-07-10' },
  { id: 'sale_007', salesCode: 'SLS03', projectName: 'Project Beta', amount: 2000, date: '2024-07-09' },
];

// Mock for SPV team management
export const spvTeams: { [key: string]: string[] } = {
  'SPV01': ['SLS01', 'SLS02'],
};
