import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Customer,
  FollowupLog,
  Template,
  AppUser,
  Quotation,
  Order,
  Product,
  BroadcastLog,
  OrderStatus,
} from '../types';
import {
  INITIAL_APP_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_FOLLOWUP_LOGS,
  INITIAL_TEMPLATES,
  INITIAL_PRODUCTS,
  INITIAL_QUOTATIONS,
  INITIAL_ORDERS,
  INITIAL_BROADCAST_LOGS,
} from '../data/seedData';

// Storage keys for local fallback persistence
const LOCAL_STORAGE_KEYS = {
  USERS: 'lakhdatar_users_db',
  CUSTOMERS: 'lakhdatar_customers_db',
  FOLLOWUP_LOGS: 'lakhdatar_followup_logs_db',
  TEMPLATES: 'lakhdatar_templates_db',
  QUOTATIONS: 'lakhdatar_quotations_db',
  ORDERS: 'lakhdatar_orders_db',
  PRODUCTS: 'lakhdatar_products_db',
  BROADCAST_LOGS: 'lakhdatar_broadcast_logs_db',
  CONFIG_URL: 'lakhdatar_supabase_url',
  CONFIG_KEY: 'lakhdatar_supabase_key',
};

// Retrieve configured Supabase credentials
export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem(LOCAL_STORAGE_KEYS.CONFIG_URL) || '';
  const localKey = localStorage.getItem(LOCAL_STORAGE_KEYS.CONFIG_KEY) || '';

  const url = (localUrl || envUrl || '').trim();
  const key = (localKey || envKey || '').trim();

  return { url, key };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (url) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONFIG_URL, url.trim());
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CONFIG_URL);
  }
  if (key) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONFIG_KEY, key.trim());
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CONFIG_KEY);
  }
}

// Check if credentials look valid (https://<project>.supabase.co)
export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return (
    Boolean(url) &&
    Boolean(key) &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    key.length > 20
  );
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// -------------------------------------------------------------
// LOCAL FALLBACK DB ENGINE
// -------------------------------------------------------------
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from local storage`, err);
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Error writing ${key} to local storage`, err);
  }
}

// Initialize seed data in local store if not present
export function initLocalStore() {
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.USERS)) {
    setLocal(LOCAL_STORAGE_KEYS.USERS, INITIAL_APP_USERS);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOMERS)) {
    setLocal(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.FOLLOWUP_LOGS)) {
    setLocal(LOCAL_STORAGE_KEYS.FOLLOWUP_LOGS, INITIAL_FOLLOWUP_LOGS);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.TEMPLATES)) {
    setLocal(LOCAL_STORAGE_KEYS.TEMPLATES, INITIAL_TEMPLATES);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS)) {
    setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.QUOTATIONS)) {
    setLocal(LOCAL_STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.ORDERS)) {
    setLocal(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.BROADCAST_LOGS)) {
    setLocal(LOCAL_STORAGE_KEYS.BROADCAST_LOGS, INITIAL_BROADCAST_LOGS);
  }
}

// Call on startup
initLocalStore();

// -------------------------------------------------------------
// 0. USER AUTH & MULTI-USER MANAGEMENT
// -------------------------------------------------------------

export async function validateUserLogin(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const cleanUser = usernameInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', cleanUser)
        .eq('password', cleanPass)
        .maybeSingle();

      if (!error && data) {
        return { success: true, user: data as AppUser };
      }
    } catch (err) {
      console.warn('Supabase app_users query warning, checking local:', err);
    }
  }

  // Fallback / Local app_users table validation
  const users = getLocal<AppUser[]>(LOCAL_STORAGE_KEYS.USERS, INITIAL_APP_USERS);
  const matched = users.find(
    (u) => u.username.toLowerCase() === cleanUser && u.password === cleanPass
  );

  if (matched) {
    return { success: true, user: matched };
  }

  return { success: false, error: 'Invalid username or password' };
}

export async function getAppUsers(): Promise<AppUser[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as AppUser[];
      }
    } catch (err) {
      console.warn('Supabase app_users fetch error:', err);
    }
  }
  return getLocal<AppUser[]>(LOCAL_STORAGE_KEYS.USERS, INITIAL_APP_USERS);
}

export async function addAppUser(
  newUser: Omit<AppUser, 'id' | 'created_at'>
): Promise<AppUser> {
  const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const user: AppUser = {
    ...newUser,
    id,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .insert([user])
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<AppUser[]>(LOCAL_STORAGE_KEYS.USERS, INITIAL_APP_USERS);
        setLocal(LOCAL_STORAGE_KEYS.USERS, [...localList, data as AppUser]);
        return data as AppUser;
      }
    } catch (err) {
      console.warn('Supabase addAppUser error:', err);
    }
  }

  const localList = getLocal<AppUser[]>(LOCAL_STORAGE_KEYS.USERS, INITIAL_APP_USERS);
  const updated = [...localList, user];
  setLocal(LOCAL_STORAGE_KEYS.USERS, updated);
  return user;
}

export async function deleteAppUser(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('app_users').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteAppUser error:', err);
    }
  }

  const localList = getLocal<AppUser[]>(LOCAL_STORAGE_KEYS.USERS, INITIAL_APP_USERS);
  const filtered = localList.filter((u) => u.id !== id);
  setLocal(LOCAL_STORAGE_KEYS.USERS, filtered);
  return true;
}

// -------------------------------------------------------------
// 1. CUSTOMERS OPERATIONS
// -------------------------------------------------------------
export async function getCustomers(): Promise<Customer[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Customer[];
      }
      if (!error && data && data.length === 0) {
        // Seed remote Supabase if completely empty
        await seedRemoteSupabase(supabase);
        const refetch = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
        if (refetch.data) return refetch.data as Customer[];
      }
    } catch (err) {
      console.warn('Supabase customers fetch error, falling back:', err);
    }
  }

  return getLocal<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
}

export async function addCustomer(newCust: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
  const id = 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const fullCustomer: Customer = {
    ...newCust,
    id,
    created_at: new Date().toISOString(),
    last_contacted_at: newCust.last_contacted_at || null,
    email_sent_status: newCust.email_sent_status || 'Not Sent',
    email_sent_at: newCust.email_sent_at || null,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([fullCustomer])
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
        setLocal(LOCAL_STORAGE_KEYS.CUSTOMERS, [data as Customer, ...localList]);
        return data as Customer;
      }
    } catch (err) {
      console.warn('Supabase addCustomer error, saving locally:', err);
    }
  }

  const localList = getLocal<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  const updated = [fullCustomer, ...localList];
  setLocal(LOCAL_STORAGE_KEYS.CUSTOMERS, updated);
  return fullCustomer;
}

export async function updateCustomer(
  id: string,
  patch: Partial<Customer>
): Promise<Customer | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
        const idx = localList.findIndex((c) => c.id === id);
        if (idx !== -1) {
          localList[idx] = { ...localList[idx], ...patch };
          setLocal(LOCAL_STORAGE_KEYS.CUSTOMERS, localList);
        }
        return data as Customer;
      }
    } catch (err) {
      console.warn('Supabase updateCustomer error, saving locally:', err);
    }
  }

  const localList = getLocal<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  const idx = localList.findIndex((c) => c.id === id);
  if (idx !== -1) {
    const updated = { ...localList[idx], ...patch };
    localList[idx] = updated;
    setLocal(LOCAL_STORAGE_KEYS.CUSTOMERS, localList);
    return updated;
  }
  return null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('customers').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteCustomer error:', err);
    }
  }

  const localList = getLocal<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  const filtered = localList.filter((c) => c.id !== id);
  setLocal(LOCAL_STORAGE_KEYS.CUSTOMERS, filtered);
  return true;
}

// -------------------------------------------------------------
// 2. FOLLOWUP LOGS OPERATIONS
// -------------------------------------------------------------
export async function getFollowupLogs(): Promise<FollowupLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('followup_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as FollowupLog[];
      }
    } catch (err) {
      console.warn('Supabase followup_logs fetch error:', err);
    }
  }

  return getLocal<FollowupLog[]>(LOCAL_STORAGE_KEYS.FOLLOWUP_LOGS, INITIAL_FOLLOWUP_LOGS);
}

export async function addFollowupLog(
  log: Omit<FollowupLog, 'id' | 'created_at'>
): Promise<FollowupLog> {
  const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const fullLog: FollowupLog = {
    ...log,
    id,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('followup_logs')
        .insert([fullLog])
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<FollowupLog[]>(
          LOCAL_STORAGE_KEYS.FOLLOWUP_LOGS,
          INITIAL_FOLLOWUP_LOGS
        );
        setLocal(LOCAL_STORAGE_KEYS.FOLLOWUP_LOGS, [data as FollowupLog, ...localList]);
        return data as FollowupLog;
      }
    } catch (err) {
      console.warn('Supabase addFollowupLog error, saving locally:', err);
    }
  }

  const localList = getLocal<FollowupLog[]>(
    LOCAL_STORAGE_KEYS.FOLLOWUP_LOGS,
    INITIAL_FOLLOWUP_LOGS
  );
  const updated = [fullLog, ...localList];
  setLocal(LOCAL_STORAGE_KEYS.FOLLOWUP_LOGS, updated);
  return fullLog;
}

// -------------------------------------------------------------
// 3. TEMPLATES OPERATIONS
// -------------------------------------------------------------
export async function getTemplates(): Promise<Template[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('templates').select('*');
      if (!error && data && data.length > 0) {
        return data as Template[];
      }
    } catch (err) {
      console.warn('Supabase templates fetch error:', err);
    }
  }

  return getLocal<Template[]>(LOCAL_STORAGE_KEYS.TEMPLATES, INITIAL_TEMPLATES);
}

export async function saveTemplate(template: Template): Promise<Template> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('templates').upsert(template);
    } catch (err) {
      console.warn('Supabase saveTemplate error:', err);
    }
  }

  const templates = getLocal<Template[]>(LOCAL_STORAGE_KEYS.TEMPLATES, INITIAL_TEMPLATES);
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx !== -1) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  setLocal(LOCAL_STORAGE_KEYS.TEMPLATES, templates);
  return template;
}

// -------------------------------------------------------------
// 4. QUOTATIONS OPERATIONS
// -------------------------------------------------------------
export async function getQuotations(): Promise<Quotation[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Quotation[];
      }
    } catch (err) {
      console.warn('Supabase quotations fetch error:', err);
    }
  }

  return getLocal<Quotation[]>(LOCAL_STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
}

export async function addQuotation(
  newQuote: Omit<Quotation, 'id' | 'created_at'>
): Promise<Quotation> {
  const id = 'quote_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const quote: Quotation = {
    ...newQuote,
    id,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .insert([quote])
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<Quotation[]>(LOCAL_STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
        setLocal(LOCAL_STORAGE_KEYS.QUOTATIONS, [data as Quotation, ...localList]);
        return data as Quotation;
      }
    } catch (err) {
      console.warn('Supabase addQuotation error:', err);
    }
  }

  const localList = getLocal<Quotation[]>(LOCAL_STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  const updated = [quote, ...localList];
  setLocal(LOCAL_STORAGE_KEYS.QUOTATIONS, updated);
  return quote;
}

export async function updateQuotation(
  id: string,
  patch: Partial<Quotation>
): Promise<Quotation | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<Quotation[]>(LOCAL_STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
        const idx = localList.findIndex((q) => q.id === id);
        if (idx !== -1) {
          localList[idx] = { ...localList[idx], ...patch };
          setLocal(LOCAL_STORAGE_KEYS.QUOTATIONS, localList);
        }
        return data as Quotation;
      }
    } catch (err) {
      console.warn('Supabase updateQuotation error:', err);
    }
  }

  const localList = getLocal<Quotation[]>(LOCAL_STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  const idx = localList.findIndex((q) => q.id === id);
  if (idx !== -1) {
    const updated = { ...localList[idx], ...patch };
    localList[idx] = updated;
    setLocal(LOCAL_STORAGE_KEYS.QUOTATIONS, localList);
    return updated;
  }
  return null;
}

export async function deleteQuotation(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('quotations').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteQuotation error:', err);
    }
  }

  const localList = getLocal<Quotation[]>(LOCAL_STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  const filtered = localList.filter((q) => q.id !== id);
  setLocal(LOCAL_STORAGE_KEYS.QUOTATIONS, filtered);
  return true;
}

export const createQuotation = addQuotation;
export const updateQuotationStatus = (id: string, status: any) =>
  updateQuotation(id, { status });

// -------------------------------------------------------------
// 5. PRODUCTS & INVENTORY RAW STOCK OPERATIONS
// -------------------------------------------------------------
export async function getProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as Product[];
      }
    } catch (err) {
      console.warn('Supabase products fetch error:', err);
    }
  }

  return getLocal<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
}

export async function updateProductStock(
  productId: string,
  newStock: number
): Promise<Product | null> {
  const safeStock = Math.max(0, newStock);
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ stock_quantity: safeStock })
        .eq('id', productId)
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        const idx = localList.findIndex((p) => p.id === productId);
        if (idx !== -1) {
          localList[idx].stock_quantity = safeStock;
          setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, localList);
        }
        return data as Product;
      }
    } catch (err) {
      console.warn('Supabase updateProductStock error:', err);
    }
  }

  const localList = getLocal<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const idx = localList.findIndex((p) => p.id === productId);
  if (idx !== -1) {
    localList[idx].stock_quantity = safeStock;
    setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, localList);
    return localList[idx];
  }
  return null;
}

export async function updateProduct(
  id: string,
  patch: Partial<Product>
): Promise<Product | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        const idx = localList.findIndex((p) => p.id === id);
        if (idx !== -1) {
          localList[idx] = { ...localList[idx], ...patch };
          setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, localList);
        }
        return data as Product;
      }
    } catch (err) {
      console.warn('Supabase updateProduct error:', err);
    }
  }

  const localList = getLocal<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const idx = localList.findIndex((p) => p.id === id);
  if (idx !== -1) {
    const updated = { ...localList[idx], ...patch };
    localList[idx] = updated;
    setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, localList);
    return updated;
  }
  return null;
}

// -------------------------------------------------------------
// 6. ORDERS OPERATIONS (with auto stock deduction on Dispatched)
// -------------------------------------------------------------
export async function getOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Order[];
      }
    } catch (err) {
      console.warn('Supabase orders fetch error:', err);
    }
  }

  return getLocal<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
}

export async function addOrder(newOrder: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
  const id = 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const order: Order = {
    ...newOrder,
    id,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
        setLocal(LOCAL_STORAGE_KEYS.ORDERS, [data as Order, ...localList]);
        return data as Order;
      }
    } catch (err) {
      console.warn('Supabase addOrder error:', err);
    }
  }

  const localList = getLocal<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  const updated = [order, ...localList];
  setLocal(LOCAL_STORAGE_KEYS.ORDERS, updated);
  return order;
}

/**
 * Update Order Status
 * Auto-decreases raw inventory stock when an order is marked 'Dispatched'
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ order: Order | null; stockDeducted: boolean }> {
  let orderToUpdate: Order | null = null;
  const currentOrders = await getOrders();
  orderToUpdate = currentOrders.find((o) => o.id === orderId) || null;

  if (!orderToUpdate) {
    return { order: null, stockDeducted: false };
  }

  const prevStatus = orderToUpdate.order_status;
  const willDeductStock = newStatus === 'Dispatched' && prevStatus !== 'Dispatched';

  // 1. If becoming Dispatched, auto-decrease stock
  if (willDeductStock && orderToUpdate.items) {
    const products = await getProducts();
    for (const item of orderToUpdate.items) {
      // Find matching product by name or category
      const matchedProd = products.find(
        (p) =>
          p.product_name.toLowerCase().includes(item.product_name.toLowerCase()) ||
          item.product_name.toLowerCase().includes(p.category.toLowerCase())
      );
      if (matchedProd) {
        const updatedQty = Math.max(0, matchedProd.stock_quantity - item.quantity);
        await updateProductStock(matchedProd.id, updatedQty);
      }
    }
  }

  // 2. Update order record
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId)
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
        const idx = localList.findIndex((o) => o.id === orderId);
        if (idx !== -1) {
          localList[idx].order_status = newStatus;
          setLocal(LOCAL_STORAGE_KEYS.ORDERS, localList);
        }
        return { order: data as Order, stockDeducted: willDeductStock };
      }
    } catch (err) {
      console.warn('Supabase updateOrderStatus error:', err);
    }
  }

  const localList = getLocal<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  const idx = localList.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    localList[idx].order_status = newStatus;
    setLocal(LOCAL_STORAGE_KEYS.ORDERS, localList);
    return { order: localList[idx], stockDeducted: willDeductStock };
  }

  return { order: null, stockDeducted: false };
}

export async function deleteOrder(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('orders').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteOrder error:', err);
    }
  }

  const localList = getLocal<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  const filtered = localList.filter((o) => o.id !== id);
  setLocal(LOCAL_STORAGE_KEYS.ORDERS, filtered);
  return true;
}

export const createOrder = addOrder;

// -------------------------------------------------------------
// 7. BROADCAST LOGS OPERATIONS
// -------------------------------------------------------------
export async function getBroadcastLogs(): Promise<BroadcastLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('broadcast_logs')
        .select('*')
        .order('sent_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as BroadcastLog[];
      }
    } catch (err) {
      console.warn('Supabase broadcast_logs fetch error:', err);
    }
  }

  return getLocal<BroadcastLog[]>(LOCAL_STORAGE_KEYS.BROADCAST_LOGS, INITIAL_BROADCAST_LOGS);
}

export async function addBroadcastLog(
  newLog: Omit<BroadcastLog, 'id' | 'sent_at'>
): Promise<BroadcastLog> {
  const id = 'bcast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const log: BroadcastLog = {
    ...newLog,
    id,
    sent_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('broadcast_logs')
        .insert([log])
        .select()
        .single();
      if (!error && data) {
        const localList = getLocal<BroadcastLog[]>(
          LOCAL_STORAGE_KEYS.BROADCAST_LOGS,
          INITIAL_BROADCAST_LOGS
        );
        setLocal(LOCAL_STORAGE_KEYS.BROADCAST_LOGS, [data as BroadcastLog, ...localList]);
        return data as BroadcastLog;
      }
    } catch (err) {
      console.warn('Supabase addBroadcastLog error:', err);
    }
  }

  const localList = getLocal<BroadcastLog[]>(
    LOCAL_STORAGE_KEYS.BROADCAST_LOGS,
    INITIAL_BROADCAST_LOGS
  );
  const updated = [log, ...localList];
  setLocal(LOCAL_STORAGE_KEYS.BROADCAST_LOGS, updated);
  return log;
}

// -------------------------------------------------------------
// SEED & RESET DATA
// -------------------------------------------------------------
export async function seedRemoteSupabase(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.from('app_users').upsert(INITIAL_APP_USERS);
    await supabase.from('customers').upsert(INITIAL_CUSTOMERS);
    await supabase.from('templates').upsert(INITIAL_TEMPLATES);
    await supabase.from('followup_logs').upsert(INITIAL_FOLLOWUP_LOGS);
    await supabase.from('products').upsert(INITIAL_PRODUCTS);
    await supabase.from('quotations').upsert(INITIAL_QUOTATIONS);
    await supabase.from('orders').upsert(INITIAL_ORDERS);
    await supabase.from('broadcast_logs').upsert(INITIAL_BROADCAST_LOGS);
    console.log('Seeded complete CRM dataset into Supabase');
  } catch (err) {
    console.warn('Seed remote Supabase error:', err);
  }
}

export function resetToDemoData(): void {
  setLocal(LOCAL_STORAGE_KEYS.USERS, INITIAL_APP_USERS);
  setLocal(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  setLocal(LOCAL_STORAGE_KEYS.FOLLOWUP_LOGS, INITIAL_FOLLOWUP_LOGS);
  setLocal(LOCAL_STORAGE_KEYS.TEMPLATES, INITIAL_TEMPLATES);
  setLocal(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  setLocal(LOCAL_STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  setLocal(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  setLocal(LOCAL_STORAGE_KEYS.BROADCAST_LOGS, INITIAL_BROADCAST_LOGS);
}
