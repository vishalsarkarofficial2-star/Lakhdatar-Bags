import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  ShoppingBag,
  FileText,
  DollarSign,
  Award,
  Package,
  Calendar,
} from 'lucide-react';
import { Customer, Order, Quotation, UserRole } from '../types';
import {
  formatINR,
  exportCustomersToCSV,
  exportOrdersToCSV,
  exportQuotationsToCSV,
} from '../utils/formatters';

interface ReportsViewProps {
  customers: Customer[];
  orders: Order[];
  quotations: Quotation[];
  userRole?: UserRole;
}

export function ReportsView({
  customers,
  orders,
  quotations,
  userRole = 'admin',
}: ReportsViewProps) {
  // If not admin, restricted view
  if (userRole !== 'admin') {
    return (
      <div className="w-full pb-28 md:pb-16 pt-8 text-center space-y-3 font-sans">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="font-serif font-bold text-lg text-[#1E3A2B]">Admin Access Required</h3>
        <p className="text-xs text-[#7A6E5F] max-w-sm mx-auto">
          The revenue, sales performance, and executive reports dashboard is restricted to Admin role credentials.
        </p>
      </div>
    );
  }

  // 1. Total revenue this month (from confirmed / completed orders)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return (
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear &&
      o.order_status !== 'Delivered' ? true : true
    );
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // 2. Lead conversion rate (% of leads that reached 'Order Confirmed')
  const totalLeads = customers.length;
  const convertedLeads = customers.filter((c) => c.lead_stage === 'Order Confirmed').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // 3. Top-selling product categories
  const categoryTotals: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      const cat = item.product_name || 'Other';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { count: 0, revenue: 0 };
      }
      categoryTotals[cat].count += item.quantity;
      categoryTotals[cat].revenue += item.quantity * item.rate;
    });
  });

  const categoryList = Object.entries(categoryTotals)
    .map(([cat, data]) => ({ name: cat, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  const maxCatRevenue = Math.max(...categoryList.map((c) => c.revenue), 1);

  // 4. Sales performance by user (orders closed per user)
  const userPerformance: Record<string, { ordersClosed: number; totalRev: number }> = {};
  orders.forEach((o) => {
    const rep = o.handled_by || 'Sales Desk';
    if (!userPerformance[rep]) {
      userPerformance[rep] = { ordersClosed: 0, totalRev: 0 };
    }
    userPerformance[rep].ordersClosed += 1;
    userPerformance[rep].totalRev += o.total_amount;
  });

  const repList = Object.entries(userPerformance).map(([rep, data]) => ({
    rep,
    ...data,
  }));

  return (
    <div className="w-full pb-28 md:pb-16 pt-1 space-y-4 font-sans">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFC9] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-lg text-[#1E3A2B] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#2D6A4F]" />
                <span>Executive Reports & Revenue Analytics</span>
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Admin
              </span>
            </div>
            <p className="text-xs text-[#7A6E5F]">
              Financial turnover, conversion funnels, category breakdown, and exportable datasets
            </p>
          </div>

          {/* Quick Export All Dropdowns/Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportCustomersToCSV(customers)}
              className="px-3 py-1.5 rounded-xl bg-[#FAF5EB] border border-[#DDD3C2] text-xs font-semibold text-[#5C4D3C] hover:bg-[#F2EADA] flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Customers CSV</span>
            </button>
            <button
              onClick={() => exportOrdersToCSV(orders)}
              className="px-3 py-1.5 rounded-xl bg-[#FAF5EB] border border-[#DDD3C2] text-xs font-semibold text-[#5C4D3C] hover:bg-[#F2EADA] flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Orders CSV</span>
            </button>
            <button
              onClick={() => exportQuotationsToCSV(quotations)}
              className="px-3 py-1.5 rounded-xl bg-[#FAF5EB] border border-[#DDD3C2] text-xs font-semibold text-[#5C4D3C] hover:bg-[#F2EADA] flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Quotes CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Month Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8DFC9] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C7E6D] flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#2D6A4F]" />
            <span>This Month Revenue</span>
          </span>
          <div className="text-xl font-serif font-bold text-[#1E3A2B] font-mono">
            {formatINR(thisMonthRevenue)}
          </div>
          <span className="text-[11px] text-[#2D6A4F] font-semibold block">
            {thisMonthOrders.length} active orders
          </span>
        </div>

        {/* Card 2: All-Time Turnover */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8DFC9] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C7E6D] flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-[#B45309]" />
            <span>Total Orders Value</span>
          </span>
          <div className="text-xl font-serif font-bold text-[#1E3A2B] font-mono">
            {formatINR(totalRevenue)}
          </div>
          <span className="text-[11px] text-[#7A6E5F] block">Across {orders.length} orders</span>
        </div>

        {/* Card 3: Lead Conversion Rate */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8DFC9] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C7E6D] flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#2D6A4F]" />
            <span>Lead Conversion Rate</span>
          </span>
          <div className="text-xl font-serif font-bold text-[#1E3A2B] font-mono">
            {conversionRate}%
          </div>
          <span className="text-[11px] text-[#2D6A4F] font-semibold block">
            {convertedLeads} of {totalLeads} won
          </span>
        </div>

        {/* Card 4: Active Quotations */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8DFC9] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C7E6D] flex items-center gap-1">
            <FileText className="w-3 h-3 text-blue-600" />
            <span>Quotations Pipeline</span>
          </span>
          <div className="text-xl font-serif font-bold text-[#1E3A2B] font-mono">
            {quotations.length}
          </div>
          <span className="text-[11px] text-[#7A6E5F] block">
            {quotations.filter((q) => q.status === 'Accepted').length} accepted deals
          </span>
        </div>
      </div>

      {/* Grid 2: Top Selling Categories & Sales Performance by User */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Bag Products Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE7D8] pb-3">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#1E3A2B] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#2D6A4F]" />
                <span>Top-Selling Bag Products by Revenue</span>
              </h3>
              <p className="text-[11px] text-[#7A6E5F]">
                Sorted by highest gross order turnover
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {categoryList.map((cat, idx) => {
              const pct = Math.round((cat.revenue / maxCatRevenue) * 100);

              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-[#1E3A2B] font-semibold">{cat.name}</span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#1E3A2B]">
                        {formatINR(cat.revenue)}
                      </span>
                      <span className="text-[10px] text-[#8C7E6D] ml-2">
                        ({cat.count.toLocaleString('en-IN')} pcs)
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-[#FAF5EB] rounded-full h-2.5 overflow-hidden border border-[#EDE3D0]">
                    <div
                      className="bg-[#2D6A4F] h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Sales Performance */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE7D8] pb-3">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#1E3A2B] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#B45309]" />
                <span>Sales Desk Team Performance</span>
              </h3>
              <p className="text-[11px] text-[#7A6E5F]">
                Orders closed and revenue generated per team member
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#EFE7D8] text-xs">
            {repList.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF5EB] text-[#2D6A4F] border border-[#E4DAC7] flex items-center justify-center font-bold text-xs">
                    {item.rep.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong className="text-xs text-[#1E3A2B] block">{item.rep}</strong>
                    <span className="text-[10px] text-[#7A6E5F]">
                      {item.ordersClosed} order(s) processed
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[#2D6A4F] block">
                    {formatINR(item.totalRev)}
                  </span>
                  <span className="text-[10px] text-[#8C7E6D]">Revenue generated</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
