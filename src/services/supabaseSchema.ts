export const SUPABASE_SQL_SCHEMA = `-- =========================================================
-- Lakhdatar Bags CRM - Database Schema for Supabase
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query)
-- =========================================================

-- 1. App Users (Multi-User Roles: Admin and Staff)
CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'User',
  role TEXT NOT NULL DEFAULT 'staff', -- 'admin' | 'staff'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to app_users" ON public.app_users
  FOR ALL USING (true) WITH CHECK (true);

-- Seed default admin & staff users
INSERT INTO public.app_users (id, username, password, name, role)
VALUES 
  ('usr_admin_1', 'lakhdatarbags', 'lakhdatarbags@#2026', 'Lakhdatar Admin', 'admin'),
  ('usr_staff_1', 'rajesh_sales', 'rajesh@2026', 'Rajesh Sharma', 'staff')
ON CONFLICT (username) DO NOTHING;

-- 2. Customers Table with Sample Tracking & Anniversary Reminders
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT,
  business_type TEXT DEFAULT 'Corporate',
  product_interest TEXT DEFAULT 'Canvas Bags',
  order_quantity TEXT,
  lead_source TEXT DEFAULT 'Website',
  lead_stage TEXT DEFAULT 'New Lead',
  assigned_to TEXT DEFAULT 'Rajesh Sharma',
  notes TEXT,
  next_followup_date DATE,
  followup_type TEXT DEFAULT 'WhatsApp',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  email_sent_status TEXT DEFAULT 'Not Sent',
  email_sent_at TIMESTAMPTZ,
  -- Sample Tracker
  sample_sent_date DATE,
  sample_type TEXT, -- 'Physical' | 'Digital' | 'Catalog PDF'
  sample_feedback TEXT DEFAULT 'Pending', -- 'Approved' | 'Rejected' | 'Pending'
  catalog_link TEXT,
  -- Celebrations
  birthday DATE,
  anniversary DATE
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to customers" ON public.customers
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Followup Logs Table
CREATE TABLE IF NOT EXISTS public.followup_logs (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  followup_type TEXT NOT NULL,
  outcome TEXT NOT NULL,
  notes TEXT,
  followup_date DATE NOT NULL,
  handled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.followup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to followup_logs" ON public.followup_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Templates Table
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'call' | 'whatsapp' | 'email'
  name TEXT NOT NULL,
  subject TEXT,
  message_body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to templates" ON public.templates
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Quotations Table (Invoice / Quotation Generator)
CREATE TABLE IF NOT EXISTS public.quotations (
  id TEXT PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft' | 'Sent' | 'Accepted' | 'Rejected'
  validity_date DATE,
  terms TEXT,
  notes TEXT,
  handled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to quotations" ON public.quotations
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Orders Table (Order & Production Tracking)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  quotation_id TEXT REFERENCES public.quotations(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  order_status TEXT NOT NULL DEFAULT 'Confirmed', -- 'Confirmed' | 'In Production' | 'Ready to Dispatch' | 'Dispatched' | 'Delivered'
  expected_delivery_date DATE,
  handled_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to orders" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Products & Inventory Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to products" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

-- Seed Initial Bag Raw Stocks
INSERT INTO public.products (id, product_name, category, stock_quantity, unit_price, unit)
VALUES
  ('prod_1', 'Heavy GSM Natural Canvas Tote Bag', 'Canvas Bags', 1850, 85, 'pcs'),
  ('prod_2', 'Eco-Cotton Carry Bag (Screen Print Ready)', 'Cotton Tote', 3200, 48, 'pcs'),
  ('prod_3', 'Golden Jute Conference Bag with Padded Handle', 'Jute Bags', 920, 135, 'pcs'),
  ('prod_4', 'Brocade Silk Wedding Potli Bag with Dori', 'Potli Bags', 1400, 65, 'pcs'),
  ('prod_5', 'Velvet Jewellery Pouch with Golden Foil Print', 'Jewellery Pouches', 4500, 22, 'pcs'),
  ('prod_6', 'Unbleached Muslin Drawstring Pouch', 'Drawstring Pouches', 2800, 28, 'pcs'),
  ('prod_7', 'Non-Woven Exhibition Promotional Bag', 'Promotional Bags', 6000, 18, 'pcs'),
  ('prod_8', 'Corporate Executive Gift Hamper Bag with Jute Trim', 'Custom Gifts', 450, 290, 'pcs')
ON CONFLICT (id) DO NOTHING;

-- 8. Broadcast Logs Table (WhatsApp Bulk Broadcast)
CREATE TABLE IF NOT EXISTS public.broadcast_logs (
  id TEXT PRIMARY KEY,
  template_name TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 0,
  filter_criteria TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  handled_by TEXT
);

ALTER TABLE public.broadcast_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to broadcast_logs" ON public.broadcast_logs
  FOR ALL USING (true) WITH CHECK (true);
`;
