import { useState, useEffect, useCallback } from 'react';
import {
  Customer,
  FollowupLog,
  Template,
  AuthSession,
  LeadStage,
  FollowupType,
  FollowupOutcome,
  Order,
  Quotation,
  Product,
  BroadcastLog,
  UserRole,
  OrderStatus,
} from './types';
import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getFollowupLogs,
  addFollowupLog,
  getTemplates,
  saveTemplate,
  getQuotations,
  createQuotation,
  updateQuotationStatus,
  getOrders,
  createOrder,
  updateOrderStatus,
  getProducts,
  updateProductStock,
  getBroadcastLogs,
  addBroadcastLog,
} from './services/supabase';
import { getOffsetDate } from './data/seedData';
import { LoginScreen } from './components/LoginScreen';
import { AppHeader, BottomNavigationBar, ActiveTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { FollowupDashboardView } from './components/FollowupDashboardView';
import { CustomerFormModal } from './components/CustomerFormModal';
import { LogOutcomeModal } from './components/LogOutcomeModal';
import { FollowupActionModal } from './components/FollowupActionModal';
import { QuotationGeneratorModal } from './components/QuotationGeneratorModal';
import { OrdersView } from './components/OrdersView';
import { BroadcastView } from './components/BroadcastView';
import { ReportsView } from './components/ReportsView';
import { MoreView } from './components/MoreView';

export default function App() {
  // Authentication session state
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem('lakhdatar_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Current active role (Admin or Staff)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return session?.role || 'admin';
  });

  // Keep userRole in sync if session changes
  useEffect(() => {
    if (session?.role) {
      setUserRole(session.role);
    }
  }, [session]);

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core Supabase entities state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [followupLogs, setFollowupLogs] = useState<FollowupLog[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer filter transfer from dashboard
  const [customersStageFilter, setCustomersStageFilter] = useState<LeadStage | null>(null);

  // Modals state
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [logOutcomeModalData, setLogOutcomeModalData] = useState<{
    customer: Customer;
    defaultType: FollowupType;
  } | null>(null);

  const [actionModalData, setActionModalData] = useState<{
    customer: Customer;
    mode: FollowupType;
  } | null>(null);

  const [quotationModalData, setQuotationModalData] = useState<{
    customer: Customer;
    quotation?: Quotation | null;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Fetch all data concurrently from Supabase
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        custList,
        logsList,
        tmplList,
        quoteList,
        orderList,
        prodList,
        bcastList,
      ] = await Promise.all([
        getCustomers(),
        getFollowupLogs(),
        getTemplates(),
        getQuotations(),
        getOrders(),
        getProducts(),
        getBroadcastLogs(),
      ]);
      setCustomers(custList);
      setFollowupLogs(logsList);
      setTemplates(tmplList);
      setQuotations(quoteList);
      setOrders(orderList);
      setProducts(prodList);
      setBroadcastLogs(bcastList);
    } catch (err) {
      console.error('Error loading Supabase data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.isAuthenticated) {
      loadAllData();
    }
  }, [session, loadAllData]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('lakhdatar_auth_session');
    setSession(null);
    setActiveTab('dashboard');
  };

  // Compute today's due followups count for badges
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFollowupsCount = customers.filter(
    (c) =>
      c.next_followup_date &&
      c.next_followup_date <= todayStr &&
      c.lead_stage !== 'Order Confirmed' &&
      c.lead_stage !== 'Lost'
  ).length;

  // Handlers for Lead CRUD
  const handleSaveCustomer = async (
    customerData: Omit<Customer, 'id' | 'created_at'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated = await updateCustomer(existingId, customerData);
      if (updated) {
        setCustomers((prev) => prev.map((c) => (c.id === existingId ? updated : c)));
        showToast(`Updated customer "${updated.name}"`);
      }
    } else {
      const created = await addCustomer(customerData);
      setCustomers((prev) => [created, ...prev]);
      showToast(`New inquiry created for "${created.name}"`);
    }
    setIsCustomerFormOpen(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (userRole !== 'admin') {
      alert('Only Admin users have permission to delete customer records.');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete "${name}" from Lakhdatar Bags CRM?`)) {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      showToast(`Deleted "${name}"`);
    }
  };

  const handleUpdateLeadStage = async (customer: Customer, newStage: LeadStage) => {
    const updated = await updateCustomer(customer.id, { lead_stage: newStage });
    if (updated) {
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? updated : c)));
      showToast(`Stage updated to "${newStage}" for ${customer.name}`);
    }
  };

  // Handler for Logging Followup Outcome (Bottom Sheet)
  const handleSaveFollowupOutcome = async (
    customerId: string,
    followupType: FollowupType,
    outcome: FollowupOutcome,
    notes: string,
    newFollowupDate?: string,
    newFollowupType?: FollowupType,
    updatedStage?: LeadStage
  ) => {
    const cust = customers.find((c) => c.id === customerId);
    const today = new Date().toISOString();

    // 1. Write log to Supabase followup_logs table
    const createdLog = await addFollowupLog({
      customer_id: customerId,
      followup_type: followupType,
      outcome,
      notes,
      followup_date: new Date().toISOString().split('T')[0],
      customer_name: cust?.name,
      customer_phone: cust?.phone,
    });
    setFollowupLogs((prev) => [createdLog, ...prev]);

    // 2. Update customer record in Supabase
    const customerPatch: Partial<Customer> = {
      last_contacted_at: today,
    };
    if (newFollowupDate) {
      customerPatch.next_followup_date = newFollowupDate;
    }
    if (newFollowupType) {
      customerPatch.followup_type = newFollowupType;
    }
    if (updatedStage) {
      customerPatch.lead_stage = updatedStage;
    }

    const updatedCust = await updateCustomer(customerId, customerPatch);
    if (updatedCust) {
      setCustomers((prev) => prev.map((c) => (c.id === customerId ? updatedCust : c)));
    }

    showToast(`Followup logged: ${outcome} (${followupType})`);
  };

  // Handler when email is dispatched
  const handleEmailStatusUpdated = async (customerId: string) => {
    const now = new Date().toISOString();
    const updatedCust = await updateCustomer(customerId, {
      email_sent_status: 'Sent',
      email_sent_at: now,
      last_contacted_at: now,
    });
    if (updatedCust) {
      setCustomers((prev) => prev.map((c) => (c.id === customerId ? updatedCust : c)));
    }
  };

  // Handler to save template
  const handleSaveTemplate = async (tmpl: Template) => {
    await saveTemplate(tmpl);
    setTemplates((prev) => prev.map((t) => (t.id === tmpl.id ? tmpl : t)));
    showToast(`Saved template "${tmpl.name}"`);
  };

  // Handler to save Quotation (Feature 1)
  const handleSaveQuotation = async (
    quoteData: Omit<Quotation, 'id' | 'created_at'>,
    existingId?: string
  ) => {
    if (existingId) {
      await updateQuotationStatus(existingId, quoteData.status);
    } else {
      const created = await createQuotation(quoteData);
      setQuotations((prev) => [created, ...prev]);
    }
    // Update customer lead stage to 'Quotation Sent' if currently New Lead or Contacted
    const currentCust = customers.find((c) => c.id === quoteData.customer_id);
    if (currentCust && (currentCust.lead_stage === 'New Lead' || currentCust.lead_stage === 'Contacted')) {
      const updated = await updateCustomer(quoteData.customer_id, { lead_stage: 'Quotation Sent' });
      if (updated) {
        setCustomers((prev) => prev.map((c) => (c.id === quoteData.customer_id ? updated : c)));
      }
    }
    showToast(`Quotation ${quoteData.quotation_number} saved to Supabase!`);
    await loadAllData();
  };

  // Handler to Convert Quotation to Active Order (Feature 1 -> 2)
  const handleConvertQuotationToOrder = async (quotation: Quotation) => {
    try {
      const newOrderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const createdOrder = await createOrder({
        order_number: newOrderNumber,
        customer_id: quotation.customer_id,
        quotation_id: quotation.id,
        items: quotation.items,
        total_amount: quotation.total_amount,
        order_status: 'Confirmed',
        expected_delivery_date: getOffsetDate(10),
        handled_by: quotation.handled_by || session?.name || 'Sales Team',
        notes: quotation.notes || `Order created from quotation ${quotation.quotation_number}`,
      });

      // Update Quotation status to Accepted
      await updateQuotationStatus(quotation.id, 'Accepted');

      // Update Customer lead stage to Order Confirmed
      await updateCustomer(quotation.customer_id, { lead_stage: 'Order Confirmed' });

      // Refresh all data
      await loadAllData();
      setQuotationModalData(null);
      setActiveTab('orders');
      showToast(`Quotation converted to Order ${createdOrder.order_number}!`);
    } catch (err: any) {
      alert(`Error converting to order: ${err.message}`);
    }
  };

  // Handler to Update Order Status (Feature 2: Auto-inventory deduction on Dispatch)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      if (updated) {
        await loadAllData();
        showToast(
          `Order status updated to "${newStatus}"${
            newStatus === 'Dispatched' ? ' • Raw stock deducted!' : ''
          }`
        );
      }
    } catch (err: any) {
      alert(`Error updating order status: ${err.message}`);
    }
  };

  // Handler to update Product Raw Stock (Feature 2)
  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    try {
      await updateProductStock(productId, newStock);
      await loadAllData();
      showToast('Inventory stock updated!');
    } catch (err: any) {
      alert(`Error updating stock: ${err.message}`);
    }
  };

  // Handler to save Broadcast Log (Feature 3)
  const handleSaveBroadcastLog = async (log: Omit<BroadcastLog, 'id' | 'sent_at'>) => {
    const saved = await addBroadcastLog(log);
    setBroadcastLogs((prev) => [saved, ...prev]);
    showToast(`Broadcast recorded: ${log.target_count} contacts targeted`);
  };

  // Deep-linking from notification bell
  const handleDeepLinkCustomer = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setEditingCustomer(cust);
      setIsCustomerFormOpen(true);
    }
  };

  const handleDeepLinkOrder = (_orderId: string) => {
    setActiveTab('orders');
  };

  // 0. LOGIN GATE: If not logged in, show Login Screen first!
  if (!session?.isAuthenticated) {
    return <LoginScreen onLoginSuccess={(sess) => setSession(sess)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2A26] flex flex-col font-sans antialiased selection:bg-[#2D6A4F] selection:text-white">
      {/* Top Application Header with In-App Notification Bell */}
      <AppHeader
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'reports' && userRole !== 'admin') {
            alert('Reports and Analytics are restricted to Admin credentials.');
            return;
          }
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
        userRole={userRole}
        currentUserName={session.name}
        onToggleUserRole={(newRole) => setUserRole(newRole)}
        customers={customers}
        orders={orders}
        onDeepLinkCustomer={handleDeepLinkCustomer}
        onDeepLinkOrder={handleDeepLinkOrder}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 md:px-8 pt-3">
        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-[#7A6E5F] text-xs">
            <div className="w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mb-3" />
            <span>Syncing Lakhdatar Bags database...</span>
          </div>
        )}

        {/* Tab 1: Dashboard */}
        {!loading && activeTab === 'dashboard' && (
          <DashboardView
            customers={customers}
            followupLogs={followupLogs}
            onNavigateToFollowups={() => setActiveTab('followups')}
            onNavigateToCustomers={(stageFilter) => {
              setCustomersStageFilter(stageFilter || null);
              setActiveTab('customers');
            }}
            onOpenAddLead={() => {
              setEditingCustomer(null);
              setIsCustomerFormOpen(true);
            }}
          />
        )}

        {/* Tab 2: Customers View */}
        {!loading && activeTab === 'customers' && (
          <CustomersView
            customers={customers}
            quotations={quotations}
            initialStageFilter={customersStageFilter}
            userRole={userRole}
            onAddLead={() => {
              setEditingCustomer(null);
              setIsCustomerFormOpen(true);
            }}
            onEditLead={(cust) => {
              setEditingCustomer(cust);
              setIsCustomerFormOpen(true);
            }}
            onDeleteLead={handleDeleteCustomer}
            onCallLead={(cust) => setActionModalData({ customer: cust, mode: 'Call' })}
            onWhatsAppLead={(cust) => setActionModalData({ customer: cust, mode: 'WhatsApp' })}
            onEmailLead={(cust) => setActionModalData({ customer: cust, mode: 'Email' })}
            onUpdateStage={handleUpdateLeadStage}
            onCreateQuotation={(cust) =>
              setQuotationModalData({ customer: cust, quotation: null })
            }
            onViewQuotation={(quote) => {
              const cust = customers.find((c) => c.id === quote.customer_id);
              if (cust) {
                setQuotationModalData({ customer: cust, quotation: quote });
              }
            }}
          />
        )}

        {/* Tab 3: Orders & Stock (NEW) */}
        {!loading && activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            products={products}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateProductStock={handleUpdateProductStock}
            userRole={userRole}
            onCallCustomer={(phone) => {
              window.location.href = `tel:${phone}`;
            }}
            onWhatsAppCustomer={(phone, text) => {
              const cleanPhone = phone.replace(/\D/g, '');
              const url = `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(
                text
              )}`;
              window.open(url, '_blank');
            }}
          />
        )}

        {/* Tab 4: Followups Dashboard */}
        {!loading && activeTab === 'followups' && (
          <FollowupDashboardView
            customers={customers}
            onOpenLogOutcome={(cust, defaultType) =>
              setLogOutcomeModalData({ customer: cust, defaultType: defaultType || 'Call' })
            }
            onCallCustomer={(cust) => setActionModalData({ customer: cust, mode: 'Call' })}
            onWhatsAppCustomer={(cust) => setActionModalData({ customer: cust, mode: 'WhatsApp' })}
            onEmailCustomer={(cust) => setActionModalData({ customer: cust, mode: 'Email' })}
          />
        )}

        {/* Tab 5: WhatsApp Bulk Broadcast (NEW) */}
        {!loading && activeTab === 'broadcast' && (
          <BroadcastView
            customers={customers}
            templates={templates}
            broadcastLogs={broadcastLogs}
            onSaveBroadcastLog={handleSaveBroadcastLog}
            currentUser={session.name}
          />
        )}

        {/* Tab 6: Executive Reports & Revenue Dashboard (Admin Only) */}
        {!loading && activeTab === 'reports' && (
          <ReportsView
            customers={customers}
            orders={orders}
            quotations={quotations}
            userRole={userRole}
          />
        )}

        {/* Tab 7: More / Settings / RBAC / CSV Exports */}
        {!loading && activeTab === 'more' && (
          <MoreView
            customers={customers}
            templates={templates}
            followupLogs={followupLogs}
            orders={orders}
            quotations={quotations}
            userRole={userRole}
            onToggleUserRole={(newRole) => setUserRole(newRole)}
            onSaveTemplate={handleSaveTemplate}
            onRefreshData={loadAllData}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavigationBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'reports' && userRole !== 'admin') {
            alert('Reports and Analytics are restricted to Admin credentials.');
            return;
          }
          setActiveTab(tab);
        }}
        userRole={userRole}
        todayFollowupsCount={todayFollowupsCount}
      />

      {/* Modals & Popups */}
      {/* 1. Add / Edit Customer Modal */}
      <CustomerFormModal
        initialCustomer={editingCustomer}
        isOpen={isCustomerFormOpen}
        onClose={() => {
          setIsCustomerFormOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
      />

      {/* 2. Log Outcome Bottom Sheet */}
      <LogOutcomeModal
        customer={logOutcomeModalData?.customer || null}
        defaultType={logOutcomeModalData?.defaultType || 'Call'}
        isOpen={Boolean(logOutcomeModalData)}
        onClose={() => setLogOutcomeModalData(null)}
        onSave={handleSaveFollowupOutcome}
      />

      {/* 3. Followup Action Modal */}
      <FollowupActionModal
        customer={actionModalData?.customer || null}
        mode={actionModalData?.mode || null}
        templates={templates}
        isOpen={Boolean(actionModalData)}
        onClose={() => setActionModalData(null)}
        onLoggedSuccess={async (customerId, type, outcome, notes) => {
          await handleSaveFollowupOutcome(customerId, type, outcome as FollowupOutcome, notes);
        }}
        onEmailStatusUpdated={handleEmailStatusUpdated}
      />

      {/* 4. Invoice / Quotation Generator Modal (Feature 1) */}
      {quotationModalData && (
        <QuotationGeneratorModal
          customer={quotationModalData.customer}
          existingQuotation={quotationModalData.quotation || null}
          isOpen={Boolean(quotationModalData)}
          onClose={() => setQuotationModalData(null)}
          onSave={handleSaveQuotation}
          onConvertToOrder={handleConvertQuotationToOrder}
          currentUser={session.name}
        />
      )}

      {/* Floating Action Confirmation Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#1E3A2B] text-[#FAF7F2] text-xs font-semibold shadow-lg border border-[#3D8565] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-[90vw] truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
