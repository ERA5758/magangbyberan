
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
  createdAt: string; 
  name_alias?: string;
  customId?: string;
  referral_by?: string;
  transaksi?: string;
  jumlah_transaksi?: number;
  input_laporan?: string;
  cek_digit?: string;
  team_leader?: string;
  salesCode?: string; 
  amount?: number; 
  [key: string]: any;
}
