import { useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  CalendarClock,
  TrendingUp,
  PhoneCall,
  MessageSquare,
  Mail,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Flame,
} from 'lucide-react';
import { Customer, FollowupLog, LeadStage, ProductInterest } from '../types';
import { formatDisplayDate } from '../utils/formatters';

interface DashboardViewProps {
  customers: Customer[];
  followupLogs: FollowupLog[];
  onNavigateToFollowups: () => void;
  onNavigateToCustomers: (stageFilter?: LeadStage) => void;
  onOpenAddLead: () => void;
}

const ALL_STAGES: LeadStage[] = [
  'New Lead',
  'Contacted',
  'Quotation Sent',
  'Sample Sent',
  'Negotiation',
  'Order Confirmed',
  'Lost',
];

const STAGE_COLORS: Record<LeadStage, { bg: string; text: string; bar: string }> = {
  'New Lead': { bg: 'bg-blue-50', text: 'text-blue-800', bar: 'bg-blue-500' },
  'Contacted': { bg: 'bg-indigo-50', text: 'text-indigo-800', bar: 'bg-indigo-500' },
  'Quotation Sent': { bg: 'bg-amber-50', text: 'text-amber-800', bar: 'bg-amber-500' },
  'Sample Sent': { bg: 'bg-purple-50', text: 'text-purple-800', bar: 'bg-purple-500' },
  'Negotiation': { bg: 'bg-orange-50', text: 'text-orange-800', bar: 'bg-orange-500' },
  'Order Confirmed': { bg: 'bg-emerald-50', text: 'text-emerald-800', bar: 'bg-emerald-600' },
  'Lost': { bg: 'bg-stone-100', text: 'text-stone-700', bar: 'bg-stone-400' },
};

export function DashboardView({
  customers,
  followupLogs,
  onNavigateToFollowups,
  onNavigateToCustomers,
  onOpenAddLead,
}: DashboardViewProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Analytics Computations from live Supabase dataset
  const metrics = useMemo(() => {
    const total = customers.length;
    const confirmed = customers.filter((c) => c.lead_stage === 'Order Confirmed').length;
    const rate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0.0';

    // Due today or overdue
    const todayDue = customers.filter(
      (c) => c.next_followup_date && c.next_followup_date <= todayStr && c.lead_stage !== 'Order Confirmed' && c.lead_stage !== 'Lost'
    );

    // This week due (next 7 days)
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const weekMaxStr = sevenDaysLater.toISOString().split('T')[0];

    const thisWeekDue = customers.filter(
      (c) =>
        c.next_followup_date &&
        c.next_followup_date >= todayStr &&
        c.next_followup_date <= weekMaxStr &&
        c.lead_stage !== 'Order Confirmed' &&
        c.lead_stage !== 'Lost'
    );

    // Due breakdown by type for today
    const callDue = todayDue.filter((c) => c.followup_type === 'Call').length;
    const waDue = todayDue.filter((c) => c.followup_type === 'WhatsApp').length;
    const emailDue = todayDue.filter((c) => c.followup_type === 'Email').length;

    // Stage counts
    const stageMap: Record<LeadStage, number> = {
      'New Lead': 0,
      'Contacted': 0,
      'Quotation Sent': 0,
      'Sample Sent': 0,
      'Negotiation': 0,
      'Order Confirmed': 0,
      'Lost': 0,
    };
    customers.forEach((c) => {
      if (stageMap[c.lead_stage] !== undefined) {
        stageMap[c.lead_stage]++;
      }
    });

    // Product Interest counts
    const productMap: Record<string, number> = {};
    customers.forEach((c) => {
      const p = c.product_interest || 'Other';
      productMap[p] = (productMap[p] || 0) + 1;
    });
    const sortedProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]);

    // Lead Source counts
    const sourceMap: Record<string, number> = {};
    customers.forEach((c) => {
      const s = c.lead_source || 'Direct';
      sourceMap[s] = (sourceMap[s] || 0) + 1;
    });
    const sortedSources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);

    return {
      total,
      confirmed,
      rate,
      todayDue,
      thisWeekDueCount: thisWeekDue.length,
      callDue,
      waDue,
      emailDue,
      stageMap,
      sortedProducts,
      sortedSources,
    };
  }, [customers, todayStr]);

  return (
    <div className="w-full pb-24 md:pb-12 pt-2 space-y-5">
      {/* Welcome Banner / Today's Action Callout */}
      <div className="bg-gradient-to-br from-[#2D6A4F] to-[#1E4534] text-[#FAF7F2] rounded-2xl p-5 sm:p-6 shadow-sm border border-[#23553E] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A7D7BF] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>Daily Followup Brief</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold leading-tight">
            Namaste! You have {metrics.todayDue.length} tasks scheduled for today
          </h2>
          <p className="text-sm text-[#D1E7DD] mt-1 max-w-xl">
            Keep inquiries warm for Lakhdatar Bags. Follow up via Phone, WhatsApp, and Email to close corporate gifting orders.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={onNavigateToFollowups}
              className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-white text-[#1E4534] font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition min-h-[44px]"
            >
              <CalendarClock className="w-4 h-4 text-[#2D6A4F]" />
              <span>Open Followup Dashboard ({metrics.todayDue.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAddLead}
              className="px-4 py-2.5 rounded-xl bg-[#3D8565] hover:bg-[#469A75] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition min-h-[44px]"
            >
              <span>+ Add New Lead</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative background pattern */}
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 pointer-events-none">
          <Package className="w-48 h-48" />
        </div>
      </div>

      {/* 4 Stacked Key Metric Cards (Mobile-friendly grid: 2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Leads */}
        <div
          onClick={() => onNavigateToCustomers()}
          className="bg-white rounded-2xl p-4 border border-[#E8DFC9] shadow-xs cursor-pointer hover:border-[#2D6A4F] transition"
        >
          <div className="flex items-center justify-between text-[#7A6E5F] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF5EB] text-[#8C6D46] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-[#1E3A2B]">
            {metrics.total}
          </div>
          <p className="text-[11px] text-[#8C7E6D] mt-1">Synced to Supabase</p>
        </div>

        {/* Followups Today */}
        <div
          onClick={onNavigateToFollowups}
          className="bg-white rounded-2xl p-4 border border-[#E8DFC9] shadow-xs cursor-pointer hover:border-[#C2410C] transition"
        >
          <div className="flex items-center justify-between text-[#7A6E5F] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
              Due Today
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FEF2F2] text-[#C2410C] flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-[#9A3412]">
            {metrics.todayDue.length}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#7A6E5F]">
            <span>{metrics.callDue} calls</span> •
            <span>{metrics.waDue} WA</span> •
            <span>{metrics.emailDue} mail</span>
          </div>
        </div>

        {/* Confirmed Orders */}
        <div
          onClick={() => onNavigateToCustomers('Order Confirmed')}
          className="bg-white rounded-2xl p-4 border border-[#E8DFC9] shadow-xs cursor-pointer hover:border-[#2D6A4F] transition"
        >
          <div className="flex items-center justify-between text-[#7A6E5F] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
              Confirmed
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#166534] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-[#166534]">
            {metrics.confirmed}
          </div>
          <p className="text-[11px] text-[#15803D] mt-1 font-medium">Orders in production</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8DFC9] shadow-xs">
          <div className="flex items-center justify-between text-[#7A6E5F] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversion</span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF5EB] text-[#2D6A4F] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-[#1E3A2B]">
            {metrics.rate}%
          </div>
          <p className="text-[11px] text-[#8C7E6D] mt-1">Confirmed / Total Leads</p>
        </div>
      </div>

      {/* Leads by Stage (Funnel View) - Stacked Mobile Friendly */}
      <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#1E3A2B] font-serif flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2D6A4F]" />
              <span>Lead Pipeline Funnel</span>
            </h3>
            <p className="text-xs text-[#7A6E5F]">Tap any stage to filter customer list</p>
          </div>
          <span className="text-xs font-semibold text-[#8C7E6D] bg-[#F5EFE4] px-2.5 py-1 rounded-full">
            {metrics.total} Active
          </span>
        </div>

        <div className="space-y-3">
          {ALL_STAGES.map((stage) => {
            const count = metrics.stageMap[stage] || 0;
            const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
            const styling = STAGE_COLORS[stage];

            return (
              <div
                key={stage}
                onClick={() => onNavigateToCustomers(stage)}
                className="group cursor-pointer p-2.5 rounded-xl hover:bg-[#FAF7F2] transition border border-transparent hover:border-[#E8DFC9]"
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#3A3228] group-hover:text-[#2D6A4F] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8C7E6D]" />
                    <span>{stage}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#1E3A2B] font-bold">{count}</span>
                    <span className="text-[11px] text-[#8C7E6D] font-normal w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-[#F0EAE1] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${styling.bar} transition-all duration-500 rounded-full`}
                    style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Interest & Lead Source Breakdown (Stacked vertical on mobile, 2-col on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Interest */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#1E3A2B] font-serif flex items-center gap-2">
              <Package className="w-4 h-4 text-[#8C6D46]" />
              <span>Top Inquired Bag Types</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {metrics.sortedProducts.map(([product, count]) => {
              const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
              return (
                <div key={product} className="text-xs">
                  <div className="flex justify-between items-center mb-1 text-[#3D352B]">
                    <span className="font-medium truncate max-w-[200px]">{product}</span>
                    <span className="font-bold text-[#1E3A2B] font-mono">
                      {count} <span className="text-[#8C7E6D] font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F3ECE0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8C6D46] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Source Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#1E3A2B] font-serif flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2D6A4F]" />
              <span>Lead Source Channels</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {metrics.sortedSources.map(([source, count]) => {
              const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
              return (
                <div key={source} className="text-xs">
                  <div className="flex justify-between items-center mb-1 text-[#3D352B]">
                    <span className="font-medium">{source}</span>
                    <span className="font-bold text-[#1E3A2B] font-mono">
                      {count} <span className="text-[#8C7E6D] font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F3ECE0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2D6A4F] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Followup Logs History */}
      <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1E3A2B] font-serif flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#C2410C]" />
            <span>Recent Followup Outcomes</span>
          </h3>
          <button
            onClick={onNavigateToFollowups}
            className="text-xs text-[#2D6A4F] font-semibold hover:underline"
          >
            View All
          </button>
        </div>

        {followupLogs.length === 0 ? (
          <p className="text-xs text-[#8C7E6D] py-3 text-center">No followups logged yet.</p>
        ) : (
          <div className="space-y-3">
            {followupLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE5D6] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {log.followup_type === 'Call' && (
                      <span className="p-1 rounded bg-blue-100 text-blue-800">
                        <PhoneCall className="w-3 h-3" />
                      </span>
                    )}
                    {log.followup_type === 'WhatsApp' && (
                      <span className="p-1 rounded bg-emerald-100 text-emerald-800">
                        <MessageSquare className="w-3 h-3" />
                      </span>
                    )}
                    {log.followup_type === 'Email' && (
                      <span className="p-1 rounded bg-amber-100 text-amber-800">
                        <Mail className="w-3 h-3" />
                      </span>
                    )}
                    <span className="font-semibold text-[#2D2A26]">
                      {log.customer_name || 'Customer'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFE8D8] text-[#5C4D3C]">
                    {log.outcome}
                  </span>
                </div>
                <p className="text-[#5C5245] line-clamp-2 pl-6">{log.notes}</p>
                <div className="text-[10px] text-[#8C7E6D] pl-6">
                  {formatDisplayDate(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
