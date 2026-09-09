import { useState, useMemo } from 'react';
import {
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Package,
  AlertCircle,
  Filter,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Customer, FollowupType, FollowupOutcome } from '../types';
import { formatDisplayDate, formatPhoneForTel } from '../utils/formatters';

interface FollowupDashboardViewProps {
  customers: Customer[];
  onOpenLogOutcome: (customer: Customer, defaultType?: FollowupType) => void;
  onCallCustomer: (customer: Customer) => void;
  onWhatsAppCustomer: (customer: Customer) => void;
  onEmailCustomer: (customer: Customer) => void;
}

export function FollowupDashboardView({
  customers,
  onOpenLogOutcome,
  onCallCustomer,
  onWhatsAppCustomer,
  onEmailCustomer,
}: FollowupDashboardViewProps) {
  const [timelineFilter, setTimelineFilter] = useState<'today' | 'overdue' | 'upcoming' | 'all'>('today');
  const [typeFilter, setTypeFilter] = useState<'ALL' | FollowupType>('ALL');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks based on selected timeline & followup type
  const { filteredTasks, counts } = useMemo(() => {
    const todayTasks: Customer[] = [];
    const overdueTasks: Customer[] = [];
    const upcomingTasks: Customer[] = [];
    const allActive: Customer[] = [];

    customers.forEach((c) => {
      // Don't show won or lost in daily followup pipeline unless specifically scheduled
      if (!c.next_followup_date) return;
      if (c.lead_stage === 'Order Confirmed' || c.lead_stage === 'Lost') return;

      allActive.push(c);

      if (c.next_followup_date === todayStr) {
        todayTasks.push(c);
      } else if (c.next_followup_date < todayStr) {
        overdueTasks.push(c);
      } else {
        upcomingTasks.push(c);
      }
    });

    let pool: Customer[] = [];
    if (timelineFilter === 'today') pool = todayTasks;
    else if (timelineFilter === 'overdue') pool = overdueTasks;
    else if (timelineFilter === 'upcoming') pool = upcomingTasks;
    else pool = allActive;

    if (typeFilter !== 'ALL') {
      pool = pool.filter((c) => c.followup_type === typeFilter);
    }

    // Sort by date ascending (oldest/most urgent first)
    pool.sort((a, b) => (a.next_followup_date || '').localeCompare(b.next_followup_date || ''));

    return {
      filteredTasks: pool,
      counts: {
        today: todayTasks.length,
        overdue: overdueTasks.length,
        upcoming: upcomingTasks.length,
        all: allActive.length,
      },
    };
  }, [customers, todayStr, timelineFilter, typeFilter]);

  return (
    <div className="w-full pb-28 md:pb-16 pt-2 space-y-4 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFC9] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg sm:text-xl text-[#1E3A2B] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2D6A4F]" />
              <span>Daily Followup Dashboard</span>
            </h2>
            <p className="text-xs text-[#7A6E5F] mt-0.5">
              Pulling today's scheduled Call, WhatsApp, and Email tasks
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF5EB] border border-[#E0D3BE] text-[#6B5539]">
            {counts.today} Due Today
          </span>
        </div>

        {/* Timeline Tabs (Today, Overdue, Upcoming, All) */}
        <div className="grid grid-cols-4 gap-1.5 mt-4 p-1 bg-[#FAF5EB] rounded-xl border border-[#EFE5D4]">
          <button
            onClick={() => setTimelineFilter('today')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition min-h-[40px] flex flex-col sm:flex-row items-center justify-center gap-1 ${
              timelineFilter === 'today'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#6B5A46] hover:bg-[#F2EADA]'
            }`}
          >
            <span>Today</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                timelineFilter === 'today' ? 'bg-white/20 text-white' : 'bg-[#E5DAC6] text-[#4A3D2D]'
              }`}
            >
              {counts.today}
            </span>
          </button>

          <button
            onClick={() => setTimelineFilter('overdue')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition min-h-[40px] flex flex-col sm:flex-row items-center justify-center gap-1 ${
              timelineFilter === 'overdue'
                ? 'bg-[#C2410C] text-white shadow-xs'
                : 'text-[#6B5A46] hover:bg-[#F2EADA]'
            }`}
          >
            <span>Overdue</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                timelineFilter === 'overdue' ? 'bg-white/20 text-white' : 'bg-[#E5DAC6] text-[#4A3D2D]'
              }`}
            >
              {counts.overdue}
            </span>
          </button>

          <button
            onClick={() => setTimelineFilter('upcoming')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition min-h-[40px] flex flex-col sm:flex-row items-center justify-center gap-1 ${
              timelineFilter === 'upcoming'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#6B5A46] hover:bg-[#F2EADA]'
            }`}
          >
            <span>Upcoming</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                timelineFilter === 'upcoming' ? 'bg-white/20 text-white' : 'bg-[#E5DAC6] text-[#4A3D2D]'
              }`}
            >
              {counts.upcoming}
            </span>
          </button>

          <button
            onClick={() => setTimelineFilter('all')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition min-h-[40px] flex flex-col sm:flex-row items-center justify-center gap-1 ${
              timelineFilter === 'all'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#6B5A46] hover:bg-[#F2EADA]'
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                timelineFilter === 'all' ? 'bg-white/20 text-white' : 'bg-[#E5DAC6] text-[#4A3D2D]'
              }`}
            >
              {counts.all}
            </span>
          </button>
        </div>

        {/* Type Filter Chips (All, Calls, WhatsApp, Email) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 text-xs">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-full font-medium transition min-h-[36px] ${
              typeFilter === 'ALL'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-white border border-[#DDD3C2] text-[#5C4D3C]'
            }`}
          >
            All Types
          </button>

          <button
            onClick={() => setTypeFilter('Call')}
            className={`px-3 py-1.5 rounded-full font-medium transition min-h-[36px] flex items-center gap-1.5 ${
              typeFilter === 'Call'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-blue-200 text-blue-800'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Calls Only</span>
          </button>

          <button
            onClick={() => setTypeFilter('WhatsApp')}
            className={`px-3 py-1.5 rounded-full font-medium transition min-h-[36px] flex items-center gap-1.5 ${
              typeFilter === 'WhatsApp'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-emerald-200 text-emerald-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Only</span>
          </button>

          <button
            onClick={() => setTypeFilter('Email')}
            className={`px-3 py-1.5 rounded-full font-medium transition min-h-[36px] flex items-center gap-1.5 ${
              typeFilter === 'Email'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-amber-200 text-amber-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Emails Only</span>
          </button>
        </div>
      </div>

      {/* Task List (Mobile-First Vertical List) */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#E8DFC9]">
            <CheckCircle2 className="w-12 h-12 text-[#2D6A4F] mx-auto mb-2 opacity-80" />
            <h3 className="font-serif font-bold text-[#1E3A2B] text-base">
              All caught up! No tasks found
            </h3>
            <p className="text-xs text-[#7A6E5F] mt-1">
              {timelineFilter === 'today'
                ? "No more followups due today. Great work staying ahead of client requests!"
                : 'No tasks scheduled in this view.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((cust) => {
            const isOverdue =
              cust.next_followup_date && cust.next_followup_date < todayStr;
            const isToday = cust.next_followup_date === todayStr;

            return (
              <div
                key={cust.id}
                id={`followup-task-${cust.id}`}
                className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs transition space-y-3 ${
                  isOverdue
                    ? 'border-red-200 bg-red-50/10'
                    : isToday
                    ? 'border-[#E8DFC9]'
                    : 'border-[#E8DFC9]'
                }`}
              >
                {/* Header: Company Name, Due Date & Followup Type Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-base text-[#1E3A2B] truncate">
                        {cust.name}
                      </h4>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#FAF5EB] text-[#7A5B36] border border-[#EADBCA] shrink-0">
                        {cust.lead_stage}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#5C4D3C] mt-0.5">
                      <span className="font-medium truncate">{cust.contact_person || 'Client'}</span>
                      <span className="text-[#DDD3C2]">•</span>
                      <span className="font-mono text-[#7A6E5F]">{cust.phone}</span>
                    </div>
                  </div>

                  {/* Scheduled Type Pill */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        cust.followup_type === 'Call'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : cust.followup_type === 'WhatsApp'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {cust.followup_type === 'Call' && <Phone className="w-3 h-3" />}
                      {cust.followup_type === 'WhatsApp' && <MessageSquare className="w-3 h-3" />}
                      {cust.followup_type === 'Email' && <Mail className="w-3 h-3" />}
                      <span>{cust.followup_type}</span>
                    </span>

                    <div
                      className={`text-[11px] font-medium mt-1 ${
                        isOverdue ? 'text-red-600 font-bold' : isToday ? 'text-[#C2410C] font-semibold' : 'text-[#7A6E5F]'
                      }`}
                    >
                      {formatDisplayDate(cust.next_followup_date)}
                    </div>
                  </div>
                </div>

                {/* Bag Requirement & Notes Snippet */}
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE5D6] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#3D352B]">
                    <span className="font-medium flex items-center gap-1.5 text-[#8C6D46]">
                      <Package className="w-3.5 h-3.5" />
                      <span>{cust.product_interest}</span>
                    </span>
                    <span className="font-mono text-[#5C4D3C]">
                      Qty: <strong className="text-[#1E3A2B]">{cust.order_quantity || 'Bulk'}</strong>
                    </span>
                  </div>

                  {cust.notes && (
                    <p className="text-[#6B5E4E] text-[11px] italic line-clamp-2 pt-0.5">
                      "{cust.notes}"
                    </p>
                  )}
                </div>

                {/* Large Action Buttons (Call/WhatsApp/Email + One-Tap Mark as Done / Log Outcome) */}
                <div className="pt-2 border-t border-[#F0E8DC] flex flex-col sm:flex-row gap-2">
                  {/* Dedicated Channel Action Button (e.g. Call Now, Send WhatsApp, Send Email) */}
                  {cust.followup_type === 'Call' && (
                    <button
                      onClick={() => onCallCustomer(cust)}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition min-h-[46px]"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Now ({cust.phone})</span>
                    </button>
                  )}

                  {cust.followup_type === 'WhatsApp' && (
                    <button
                      onClick={() => onWhatsAppCustomer(cust)}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition min-h-[46px]"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send WhatsApp Template</span>
                    </button>
                  )}

                  {cust.followup_type === 'Email' && (
                    <button
                      onClick={() => onEmailCustomer(cust)}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition min-h-[46px]"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Quotation / Catalog Email</span>
                    </button>
                  )}

                  {/* One-Tap Mark as Done / Log Outcome Button */}
                  <button
                    onClick={() => onOpenLogOutcome(cust, cust.followup_type)}
                    className="py-3 px-4 rounded-xl bg-[#FAF5EC] hover:bg-[#F2E7D5] border border-[#DDD0BC] text-[#4A3B2C] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition min-h-[46px]"
                    title="Log outcome in bottom sheet"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Log Outcome / Reschedule</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
