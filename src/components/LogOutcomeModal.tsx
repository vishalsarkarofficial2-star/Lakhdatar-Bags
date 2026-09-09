import { useState, type FormEvent } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  Phone,
  MessageSquare,
  Mail,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Customer, FollowupType, FollowupOutcome, LeadStage } from '../types';
import { getOffsetDate } from '../data/seedData';

interface LogOutcomeModalProps {
  customer: Customer | null;
  defaultType?: FollowupType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    customerId: string,
    followupType: FollowupType,
    outcome: FollowupOutcome,
    notes: string,
    newFollowupDate?: string,
    newFollowupType?: FollowupType,
    updatedStage?: LeadStage
  ) => Promise<void>;
}

const OUTCOMES: { value: FollowupOutcome; label: string; desc: string }[] = [
  {
    value: 'Interested',
    label: 'Interested',
    desc: 'Client is engaged, requested mockups or pricing',
  },
  {
    value: 'Quotation Requested',
    label: 'Quotation Requested',
    desc: 'Needs updated commercial wholesale rates',
  },
  {
    value: 'Reschedule',
    label: 'Reschedule',
    desc: 'Client asked to call back or follow up later',
  },
  {
    value: 'Order Placed',
    label: 'Order Placed 🎉',
    desc: 'Deal finalized! Ready for production',
  },
  {
    value: 'No Answer',
    label: 'No Answer / Busy',
    desc: 'Call went unanswered, pinged on WhatsApp',
  },
  {
    value: 'Not Interested',
    label: 'Not Interested',
    desc: 'Lead declined or budget mismatch',
  },
];

export function LogOutcomeModal({
  customer,
  defaultType = 'Call',
  isOpen,
  onClose,
  onSave,
}: LogOutcomeModalProps) {
  if (!isOpen || !customer) return null;

  const [followupType, setFollowupType] = useState<FollowupType>(
    defaultType || customer.followup_type || 'Call'
  );
  const [outcome, setOutcome] = useState<FollowupOutcome>('Interested');
  const [notes, setNotes] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState(getOffsetDate(2));
  const [rescheduleType, setRescheduleType] = useState<FollowupType>(followupType);
  const [newStage, setNewStage] = useState<LeadStage>(customer.lead_stage);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isRescheduled = outcome === 'Reschedule' || outcome === 'No Answer';
      const updatedDate = isRescheduled ? rescheduleDate : undefined;
      const updatedType = isRescheduled ? rescheduleType : undefined;

      // If marked Order Placed, auto-advance stage to Order Confirmed if selected
      const targetStage = outcome === 'Order Placed' ? 'Order Confirmed' : newStage;

      await onSave(
        customer.id,
        followupType,
        outcome,
        notes,
        updatedDate,
        updatedType,
        targetStage !== customer.lead_stage ? targetStage : undefined
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      {/* Bottom Sheet on Mobile, Modal on Tablet/Desktop */}
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E8DFC9] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFE7D8]">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7E6D]">
              Followup Log & Status Update
            </span>
            <h3 className="font-serif font-bold text-base text-[#1E3A2B] truncate">
              {customer.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F5EFE4] text-[#8C7E6D] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 text-xs">
          {/* Followup Channel selector */}
          <div>
            <label className="block font-semibold text-[#5A5043] mb-1.5 uppercase tracking-wider text-[10px]">
              Followup Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFollowupType('Call')}
                className={`py-2 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 border transition min-h-[42px] ${
                  followupType === 'Call'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E8DFC9] text-[#5C4D3C]'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>

              <button
                type="button"
                onClick={() => setFollowupType('WhatsApp')}
                className={`py-2 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 border transition min-h-[42px] ${
                  followupType === 'WhatsApp'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E8DFC9] text-[#5C4D3C]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setFollowupType('Email')}
                className={`py-2 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 border transition min-h-[42px] ${
                  followupType === 'Email'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E8DFC9] text-[#5C4D3C]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
            </div>
          </div>

          {/* Outcome Radio Cards */}
          <div>
            <label className="block font-semibold text-[#5A5043] mb-1.5 uppercase tracking-wider text-[10px]">
              What was the outcome?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setOutcome(item.value)}
                  className={`p-2.5 text-left rounded-xl border transition flex flex-col justify-between ${
                    outcome === item.value
                      ? 'bg-[#FAF5EB] border-[#2D6A4F] text-[#1E3A2B] ring-1 ring-[#2D6A4F]'
                      : 'bg-white border-[#E8DFC9] text-[#5C4D3C] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span className="font-bold text-xs">{item.label}</span>
                  <span className="text-[10px] text-[#8C7E6D] mt-0.5 line-clamp-1">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* If Reschedule or No Answer: Select New Next Followup Date */}
          {(outcome === 'Reschedule' || outcome === 'No Answer') && (
            <div className="p-3.5 rounded-xl bg-[#FAF5EB] border border-[#E8DFC9] space-y-3">
              <div className="flex items-center gap-2 text-[#9A3412] font-semibold text-xs">
                <Clock className="w-4 h-4" />
                <span>Schedule Next Followup Date in Supabase</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#7A6E5F] mb-1">Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white border border-[#DDD3C2] text-xs font-mono text-[#2D2A26]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#7A6E5F] mb-1">Followup Method</label>
                  <select
                    value={rescheduleType}
                    onChange={(e) => setRescheduleType(e.target.value as FollowupType)}
                    className="w-full p-2 rounded-lg bg-white border border-[#DDD3C2] text-xs text-[#2D2A26]"
                  >
                    <option value="Call">Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Quick Notes input */}
          <div>
            <label className="block font-semibold text-[#5A5043] mb-1.5 uppercase tracking-wider text-[10px]">
              Outcome Notes / Conversation Summary
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Client requested sample of 500 cotton tote bags with screen print quote. Call back Monday..."
              className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs text-[#2D2A26] placeholder-[#A09382] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>

          {/* Lead Stage advancement */}
          <div>
            <label className="block font-semibold text-[#5A5043] mb-1.5 uppercase tracking-wider text-[10px]">
              Update Lead Stage (Optional)
            </label>
            <select
              value={outcome === 'Order Placed' ? 'Order Confirmed' : newStage}
              onChange={(e) => setNewStage(e.target.value as LeadStage)}
              disabled={outcome === 'Order Placed'}
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs text-[#2D2A26]"
            >
              <option value="New Lead">New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Quotation Sent">Quotation Sent</option>
              <option value="Sample Sent">Sample Sent</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Order Confirmed">Order Confirmed</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Submit Button (Sticky at bottom on mobile) */}
          <div className="pt-3 border-t border-[#EFE7D8]">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#23553E] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60 min-h-[48px]"
            >
              {saving ? (
                <span>Writing to Supabase...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Log & Update Customer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
