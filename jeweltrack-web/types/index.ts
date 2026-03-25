
export interface Shop {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  hallmark_rate: number;
  subscription_plan: 'BASIC' | 'PRO' | 'PREMIUM';
  subscription_status: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  created_at: string;
}


export interface Customer{
id: string;
  shop_id: string;
  name: string;
  phone: string;
  village: string;
  address?: string;
  created_at: string;
}

export interface BillItem{
  id: string;
  bill_id: string;
  item_name: string;
  metal: 'GOLD' | 'SILVER';
  purity?: 'K22' | 'K18' | 'K24';
  rate: number;
  weight: number;
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
  billItem: BillItem[];

}


export interface AuthResponse{
     access_token: string;
}

export interface RegisterResponse {
    message : string ;
    shopId :string ;
}