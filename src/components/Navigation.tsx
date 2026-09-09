import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Package,
  Radio,
  BarChart3,
  MoreHorizontal,
  LogOut,
  ShoppingBag,
  Database,
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  Gift,
  Heart,
  UserCheck,
  Shield,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';
import { Customer, Order, UserRole } from '../types';
import { formatINR } from '../utils/formatters';

export type ActiveTab =
  | 'dashboard'
  | 'customers'
  | 'orders'
  | 'followups'
  | 'broadcast'
  | 'reports'
  | 'more';

export interface NotificationItem {
  id: string;
  type: 'overdue_followup' | 'order_delivery' | 'new_lead' | 'celebration';
  title: string;
  description: string;
  customerId?: string;
  orderId?: string;
  severity: 'urgent' | 'warning' | 'info';
}

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  userRole: UserRole;
  currentUserName: string;
  onToggleUserRole?: (newRole: UserRole) => void;
  customers: Customer[];
  orders: Order[];
  onDeepLinkCustomer?: (customerId: string) => void;
  onDeepLinkOrder?: (orderId: string) => void;
}

export function AppHeader({
  activeTab,
  onSelectTab,
  onLogout,
  userRole,
  currentUserName,
  onToggleUserRole,
  customers,
  orders,
  onDeepLinkCustomer,
  onDeepLinkOrder,
}: NavigationProps) {
  const isConnected = isSupabaseConfigured();
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live notifications
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMMDD = todayStr.substring(5); // "MM-DD"

  const notifications: NotificationItem[] = [];

  // 1. Overdue Followups
  customers.forEach((c) => {
    if (
      c.next_followup_date &&
      c.next_followup_date < todayStr &&
      c.lead_stage !== 'Order Confirmed' &&
      c.lead_stage !== 'Lost'
    ) {
      notifications.push({
        id: `overdue_${c.id}`,
        type: 'overdue_followup',
        title: `Overdue Followup: ${c.name}`,
        description: `Due on ${c.next_followup_date} (${c.followup_type} for ${c.product_interest})`,
        customerId: c.id,
        severity: 'urgent',
      });
    }
  });

  // 2. Orders nearing delivery (within 3 days) or overdue
  orders.forEach((o) => {
    if (o.order_status !== 'Delivered' && o.order_status !== 'Dispatched' && o.expected_delivery_date) {
      const daysDiff = Math.ceil(
        (new Date(o.expected_delivery_date).getTime() - new Date(todayStr).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const custName = customers.find((c) => c.id === o.customer_id)?.name || 'Wholesale Client';
      if (daysDiff < 0) {
        notifications.push({
          id: `order_overdue_${o.id}`,
          type: 'order_delivery',
          title: `Delivery Overdue: ${o.order_number}`,
          description: `Customer: ${custName} • Due was ${o.expected_delivery_date}`,
          orderId: o.id,
          severity: 'urgent',
        });
      } else if (daysDiff <= 3) {
        notifications.push({
          id: `order_due_soon_${o.id}`,
          type: 'order_delivery',
          title: `Delivery Due in ${daysDiff === 0 ? 'Today' : `${daysDiff}d`}: ${o.order_number}`,
          description: `Total: ${formatINR(o.total_amount)} • Status: ${o.order_status}`,
          orderId: o.id,
          severity: 'warning',
        });
      }
    }
  });

  // 3. New leads received today uncontacted
  customers.forEach((c) => {
    if (
      c.lead_stage === 'New Lead' &&
      !c.last_contacted_at &&
      c.created_at &&
      c.created_at.startsWith(todayStr)
    ) {
      notifications.push({
        id: `new_lead_${c.id}`,
        type: 'new_lead',
        title: `Uncontacted Lead: ${c.name}`,
        description: `Inquiry for ${c.product_interest} (${c.order_quantity || 'Bulk'})`,
        customerId: c.id,
        severity: 'info',
      });
    }
  });

  // 4. Birthday & Anniversary celebrations today
  customers.forEach((c) => {
    if (c.birthday && c.birthday.endsWith(todayMMDD)) {
      notifications.push({
        id: `bday_${c.id}`,
        type: 'celebration',
        title: `🎂 Birthday Today: ${c.contact_person || c.name}`,
        description: `Send greeting to ${c.phone} from Lakhdatar Bags!`,
        customerId: c.id,
        severity: 'info',
      });
    }
    if (c.anniversary && c.anniversary.endsWith(todayMMDD)) {
      notifications.push({
        id: `anniv_${c.id}`,
        type: 'celebration',
        title: `💍 Anniversary Today: ${c.contact_person || c.name}`,
        description: `Send warm anniversary wishes!`,
        customerId: c.id,
        severity: 'info',
      });
    }
  });

  // Followups due today count for badge
  const todayFollowupsCount = customers.filter(
    (c) => c.next_followup_date === todayStr && c.lead_stage !== 'Order Confirmed'
  ).length;

  const handleNotificationClick = (n: NotificationItem) => {
    setShowNotifications(false);
    if (n.customerId && onDeepLinkCustomer) {
      onSelectTab('customers');
      onDeepLinkCustomer(n.customerId);
    } else if (n.orderId && onDeepLinkOrder) {
      onSelectTab('orders');
      onDeepLinkOrder(n.orderId);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFC9] px-3 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2D6A4F] text-[#FAF7F2] flex items-center justify-center shadow-xs shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base sm:text-lg text-[#1E3A2B] leading-none">
                Lakhdatar Bags
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-[#EFE7D8] text-[#5C4D3C] border border-[#DDD0BC]">
                {userRole === 'admin' ? 'Admin' : 'Staff'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#7A6E5F] mt-0.5 truncate max-w-[140px] sm:max-w-none">
              Wholesale Bags CRM & Factory
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#EFE8D8] p-1 rounded-xl border border-[#DFD3BE]">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'dashboard'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C4D3C] hover:bg-[#E5DBC7]'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('customers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'customers'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C4D3C] hover:bg-[#E5DBC7]'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => onSelectTab('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeTab === 'orders'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C4D3C] hover:bg-[#E5DBC7]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Orders & Stock</span>
          </button>
          <button
            onClick={() => onSelectTab('followups')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'followups'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C4D3C] hover:bg-[#E5DBC7]'
            }`}
          >
            <span>Followups</span>
            {todayFollowupsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#C2410C] text-white">
                {todayFollowupsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('broadcast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeTab === 'broadcast'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C4D3C] hover:bg-[#E5DBC7]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Broadcast</span>
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => onSelectTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === 'reports'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'text-[#5C4D3C] hover:bg-[#E5DBC7]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>
          )}
          <button
            onClick={() => onSelectTab('more')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'more'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C4D3C] hover:bg-[#E5DBC7]'
            }`}
          >
            More
          </button>
        </nav>

        {/* Right side controls: Notification Bell, Role Switcher & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Notification Bell Dropdown */}
          <div className="relative" ref={bellRef}>
            <button
              id="header-notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 sm:p-2.5 rounded-xl bg-white border border-[#DDD0BC] hover:bg-[#FAF5EB] text-[#5C4D3C] transition min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Notifications & Reminders"
            >
              <Bell className="w-4 h-4 text-[#2D6A4F]" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-center rounded-full text-[10px] font-bold bg-[#C2410C] text-white shadow-xs animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Popover Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-[#E8DFC9] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE7D8]">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#2D6A4F]" />
                    <span className="font-serif font-bold text-sm text-[#1E3A2B]">
                      Alerts & Reminders
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#FAF5EB] text-[#8C6239] px-2 py-0.5 rounded-full border border-[#EADBCA]">
                    {notifications.length} active
                  </span>
                </div>

                <div className="max-h-[350px] overflow-y-auto space-y-1.5 py-2">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8C7E6D]">
                      <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-1 opacity-70" />
                      <p className="font-semibold text-[#2D6A4F]">All caught up!</p>
                      <p className="text-[11px] mt-0.5">
                        No overdue followups or pending delivery alerts right now.
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 hover:scale-[1.01] ${
                          n.severity === 'urgent'
                            ? 'bg-red-50/70 border-red-200 hover:bg-red-100/70'
                            : n.severity === 'warning'
                            ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
                            : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {n.type === 'overdue_followup' && (
                            <Clock className="w-4 h-4 text-red-600" />
                          )}
                          {n.type === 'order_delivery' && (
                            <Package className="w-4 h-4 text-amber-700" />
                          )}
                          {n.type === 'new_lead' && (
                            <Sparkles className="w-4 h-4 text-emerald-700" />
                          )}
                          {n.type === 'celebration' && (
                            <Gift className="w-4 h-4 text-pink-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1E3A2B] truncate leading-tight">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-[#5C4D3C] mt-0.5 leading-snug">
                            {n.description}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8C7E6D] shrink-0 self-center" />
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-[#EFE7D8] text-center">
                  <span className="text-[10px] text-[#8C7E6D]">
                    Click any alert to jump directly to record
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User Role Badge / Quick Switcher */}
          {onToggleUserRole && (
            <button
              onClick={() => onToggleUserRole(userRole === 'admin' ? 'staff' : 'admin')}
              title={`Logged in as ${currentUserName} (${userRole}). Click to toggle Admin/Staff view.`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#DDD0BC] hover:bg-[#FAF5EB] text-[11px] font-semibold text-[#5C4D3C] transition"
            >
              <Shield className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span className="capitalize">{userRole}</span>
            </button>
          )}

          {/* Database indicator */}
          <div
            onClick={() => onSelectTab('more')}
            title={isConnected ? 'Connected to Supabase Cloud' : 'Supabase Table Mode (Local Synced)'}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#E2D8C3] text-[11px] font-medium text-[#655644] cursor-pointer hover:bg-[#FAF7F2]"
          >
            <Database className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="truncate max-w-[90px]">
              {isConnected ? 'Supabase' : 'Table Mode'}
            </span>
          </div>

          {/* Logout button */}
          <button
            id="app-logout-button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#FAF0E6] hover:bg-[#F2E0CE] text-[#8C3A27] border border-[#E8CEBF] text-xs font-semibold transition min-h-[40px]"
            title="Sign out of Lakhdatar Bags CRM"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNavigationBar({
  activeTab,
  onSelectTab,
  userRole,
  todayFollowupsCount,
}: {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  todayFollowupsCount: number;
}) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5DCC9] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-1 py-1 pb-safe">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <button
          id="nav-tab-dashboard"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1.5 rounded-xl transition ${
            activeTab === 'dashboard'
              ? 'text-[#2D6A4F] font-bold'
              : 'text-[#7D6F5E] hover:text-[#2D6A4F]'
          }`}
        >
          <LayoutDashboard
            className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
          />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>

        {/* Customers */}
        <button
          id="nav-tab-customers"
          onClick={() => onSelectTab('customers')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1.5 rounded-xl transition ${
            activeTab === 'customers'
              ? 'text-[#2D6A4F] font-bold'
              : 'text-[#7D6F5E] hover:text-[#2D6A4F]'
          }`}
        >
          <Users
            className={`w-5 h-5 ${activeTab === 'customers' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
          />
          <span className="text-[10px] mt-0.5">Customers</span>
        </button>

        {/* Orders & Stock */}
        <button
          id="nav-tab-orders"
          onClick={() => onSelectTab('orders')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1.5 rounded-xl transition ${
            activeTab === 'orders'
              ? 'text-[#2D6A4F] font-bold'
              : 'text-[#7D6F5E] hover:text-[#2D6A4F]'
          }`}
        >
          <Package
            className={`w-5 h-5 ${activeTab === 'orders' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
          />
          <span className="text-[10px] mt-0.5">Orders</span>
        </button>

        {/* Followups */}
        <button
          id="nav-tab-followups"
          onClick={() => onSelectTab('followups')}
          className={`relative flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1.5 rounded-xl transition ${
            activeTab === 'followups'
              ? 'text-[#2D6A4F] font-bold'
              : 'text-[#7D6F5E] hover:text-[#2D6A4F]'
          }`}
        >
          <div className="relative">
            <CalendarClock
              className={`w-5 h-5 ${activeTab === 'followups' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
            />
            {todayFollowupsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#C2410C] text-white shadow-xs">
                {todayFollowupsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Followups</span>
        </button>

        {/* Broadcast */}
        <button
          id="nav-tab-broadcast"
          onClick={() => onSelectTab('broadcast')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1.5 rounded-xl transition ${
            activeTab === 'broadcast'
              ? 'text-[#2D6A4F] font-bold'
              : 'text-[#7D6F5E] hover:text-[#2D6A4F]'
          }`}
        >
          <Radio
            className={`w-5 h-5 ${activeTab === 'broadcast' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
          />
          <span className="text-[10px] mt-0.5">Broadcast</span>
        </button>

        {/* More (or Reports if Admin) */}
        <button
          id="nav-tab-more"
          onClick={() => onSelectTab('more')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1.5 rounded-xl transition ${
            activeTab === 'more' || activeTab === 'reports'
              ? 'text-[#2D6A4F] font-bold'
              : 'text-[#7D6F5E] hover:text-[#2D6A4F]'
          }`}
        >
          <MoreHorizontal
            className={`w-5 h-5 ${
              activeTab === 'more' || activeTab === 'reports' ? 'stroke-[2.4]' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </div>
    </div>
  );
}
