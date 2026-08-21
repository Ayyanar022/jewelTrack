
export type Role = 'SUPER_ADMIN' | 'SHOP_OWNER' | 'MANAGER' | 'CASHIER';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: Role;
  is_active: boolean;
  shop_id?: string | null;
  shop?: Shop | null;
  created_at: string;
}

export interface Shop {
  id: string;
  name: string;
  owner_name?: string;
  phone?: string;
  hallmark_rate: number;
  subscription_plan: string;
  subscription_status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE';
  created_at: string;
  users?: User[];
  _count?: {
    bill?: number;
    customer?: number;
    users?: number;
  };
}

export interface Plan {
  id: string;
  name: string;
  price: number; // in paise
  max_users: number;
  max_invoices_per_month: number | null;
  max_branches: number;
  features?: Record<string, boolean> | null;
  note?: string | null;
  is_active: boolean;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  village: string;
  address?: string;
  created_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  item_name?: string;
  category?: { name: string };
  category_id?: string;
  metal: 'GOLD' | 'SILVER';
  purity?: 'K22' | 'K18' | 'K24';
  rate: number;
  gross_weight?: number;
  net_weight?: number;
  weight?: number;
  wastage?: number;
  making_charge: number;
  amount: number;
}

export interface Bill {
  id: string;
  shop_id: string;
  customer_id: string;
  customer: Customer;
  bill_number: string;
  is_gst_bill: boolean;
  total_amount: number;
  discount: number;
  notes?: string;
  created_at: string;
  created_by_user_id?: string | null;
  created_by?: {
    id: string;
    name: string;
    role: Role;
    phone?: string;
  } | null;
  billItem: BillItem[];
}

export interface AuthResponse {
  access_token: string;
  user: User;
  shop: Shop | null;
}

export interface RegisterResponse {
  message: string;
  shopId: string;
  userId?: string;
}