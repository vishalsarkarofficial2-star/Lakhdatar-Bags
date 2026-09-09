export type BusinessType = 'Corporate' | 'Retailer' | 'Individual' | 'Reseller';

export type ProductInterest =
  | 'Canvas Bags'
  | 'Cotton Tote'
  | 'Jute Bags'
  | 'Potli Bags'
  | 'Drawstring Pouches'
  | 'Jewellery Pouches'
  | 'Promotional Bags'
  | 'Custom Gifts';

export type LeadSource =
  | 'Instagram'
  | 'Website'
  | 'Referral'
  | 'Walk-in'
  | 'Trade Show'
  | 'Indiamart';

export type LeadStage =
  | 'New Lead'
  | 'Contacted'
  | 'Quotation Sent'
  | 'Sample Sent'
  | 'Negotiation'
  | 'Order Confirmed'
  | 'Lost';

export type FollowupType = 'Call' | 'WhatsApp' | 'Email';

export type FollowupOutcome =
  | 'Interested'
  | 'Not Interested'
  | 'Reschedule'
  | 'Order Placed'
  | 'No Answer'
  | 'Quotation Requested';

export type UserRole = 'admin' | 'staff';

export interface Customer {
  id: string;
  name: string; // Company or Customer Name
  contact_person: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  business_type: BusinessType;
  product_interest: ProductInterest;
  order_quantity: string;
  lead_source: LeadSource;
  lead_stage: LeadStage;
  assigned_to: string;
  notes: string;
  next_followup_date: string; // YYYY-MM-DD
  followup_type: FollowupType;
  created_at: string;
  last_contacted_at: string | null;
  email_sent_status?: 'Sent' | 'Not Sent';
  email_sent_at?: string | null;
  // Sample / Catalog Sharing Tracking
  sample_sent_date?: string | null;
  sample_type?: SampleType | null;
  sample_feedback?: SampleFeedback | null;
  catalog_link?: string | null;
  // Celebrations & Reminders
  birthday?: string | null; // YYYY-MM-DD
  anniversary?: string | null; // YYYY-MM-DD
}

export type SampleType = 'Physical' | 'Digital' | 'Catalog PDF';
export type SampleFeedback = 'Approved' | 'Rejected' | 'Pending' | 'Revision Requested';

export interface FollowupLog {
  id: string;
  customer_id: string;
  followup_type: FollowupType;
  outcome: FollowupOutcome;
  notes: string;
  followup_date: string;
  created_at: string;
  handled_by?: string;
  // joined customer helper
  customer_name?: string;
  customer_phone?: string;
}

export interface Template {
  id: string;
  type: 'call' | 'whatsapp' | 'email';
  name: string;
  subject?: string;
  message_body: string;
}

export interface AppUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  created_at?: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  username: string;
  name: string;
  role: UserRole;
  loginTime: string;
}

// 1. INVOICE / QUOTATION MODULE
export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected';

export interface QuotationItem {
  product_name: ProductInterest | string;
  quantity: number;
  rate: number;
  total: number;
  gsm_spec?: string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  items: QuotationItem[];
  total_amount: number;
  status: QuotationStatus;
  validity_date: string; // YYYY-MM-DD
  terms?: string;
  notes?: string;
  handled_by?: string;
  created_at: string;
}

// 2. ORDER & INVENTORY MODULE
export type OrderStatus =
  | 'Confirmed'
  | 'In Production'
  | 'Ready to Dispatch'
  | 'Dispatched'
  | 'Delivered';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  quotation_id?: string;
  items: QuotationItem[];
  total_amount: number;
  order_status: OrderStatus;
  expected_delivery_date: string; // YYYY-MM-DD
  handled_by?: string;
  notes?: string;
  created_at: string;
}

export interface Product {
  id: string;
  product_name: string;
  category: ProductInterest | string;
  stock_quantity: number;
  unit_price: number;
  unit: string;
}

// 4. WHATSAPP BROADCAST MODULE
export interface BroadcastLog {
  id: string;
  template_name: string;
  target_count: number;
  filter_criteria: string;
  sent_at: string;
  handled_by: string;
}

// 5. IN-APP NOTIFICATIONS
export interface NotificationItem {
  id: string;
  type: 'overdue_followup' | 'order_due' | 'new_lead' | 'celebration';
  title: string;
  message: string;
  timestamp: string;
  badgeColor: 'red' | 'amber' | 'emerald' | 'blue';
  actionTab?: 'followups' | 'orders' | 'customers';
  targetId?: string;
}
