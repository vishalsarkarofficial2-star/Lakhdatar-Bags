import { useState } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  ExternalLink,
  Filter,
  Layers,
  Sparkles,
  History,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Customer, Template, BroadcastLog, ProductInterest, LeadStage } from '../types';
import { renderTemplate, formatPhoneForWhatsApp } from '../utils/formatters';

interface BroadcastViewProps {
  customers: Customer[];
  templates: Template[];
  broadcastLogs: BroadcastLog[];
  onSaveBroadcastLog: (log: Omit<BroadcastLog, 'id' | 'sent_at'>) => Promise<void>;
  currentUser?: string;
}

export function BroadcastView({
  customers,
  templates,
  broadcastLogs,
  onSaveBroadcastLog,
  currentUser = 'Sales Desk',
}: BroadcastViewProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Filters
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');

  // Templates
  const waTemplates = templates.filter((t) => t.type === 'whatsapp');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    waTemplates[0]?.id || ''
  );
  const [customText, setCustomText] = useState<string>(
    waTemplates[0]?.message_body || ''
  );

  // Audience matching
  const targetAudience = customers.filter((c) => {
    const matchesStage = stageFilter === 'All' || c.lead_stage === stageFilter;
    const matchesProduct = productFilter === 'All' || c.product_interest === productFilter;
    return matchesStage && matchesProduct;
  });

  // Broadcast Queue progression state
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const selectedTemplate = waTemplates.find((t) => t.id === selectedTemplateId);

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = waTemplates.find((t) => t.id === tmplId);
    if (tmpl) setCustomText(tmpl.message_body);
  };

  const handleStartBroadcast = () => {
    if (targetAudience.length === 0) {
      alert('No customers match the selected filter.');
      return;
    }
    setSentMap({});
    setCurrentIndex(0);
    setIsBroadcasting(true);
  };

  const handleSendNext = async (customer: Customer, index: number) => {
    const phone = customer.whatsapp_number || customer.phone;
    const cleanPhone = formatPhoneForWhatsApp(phone);
    const renderedMsg = renderTemplate(customText, customer);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(renderedMsg)}`;

    window.open(waUrl, '_blank');

    setSentMap((prev) => ({ ...prev, [customer.id]: true }));

    if (index + 1 < targetAudience.length) {
      setCurrentIndex(index + 1);
    } else {
      // Completed full broadcast
      await onSaveBroadcastLog({
        template_name: selectedTemplate?.name || 'Custom Broadcast',
        target_count: targetAudience.length,
        filter_criteria: `Stage: ${stageFilter}, Product: ${productFilter}`,
        handled_by: currentUser,
      });
      alert(`Broadcast complete! Logged ${targetAudience.length} customer sends to Supabase.`);
    }
  };

  return (
    <div className="w-full pb-28 md:pb-16 pt-1 space-y-4 font-sans">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFC9] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#1E3A2B] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#2D6A4F]" />
              <span>WhatsApp Bulk Broadcast</span>
            </h2>
            <p className="text-xs text-[#7A6E5F]">
              Filter target leads, personalize messages with client tags, and dispatch via WhatsApp
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#FAF5EB] rounded-xl border border-[#EDE5D6] text-xs">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-1.5 px-3 rounded-lg font-semibold transition ${
                activeTab === 'create'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'text-[#6B5A46] hover:bg-[#F2EADA]'
              }`}
            >
              Compose Broadcast
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-1.5 px-3 rounded-lg font-semibold transition ${
                activeTab === 'history'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'text-[#6B5A46] hover:bg-[#F2EADA]'
              }`}
            >
              Past Logs ({broadcastLogs.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2 Cols: Setup & Filters */}
          <div className="lg:col-span-2 space-y-4">
            {/* 1. Filter Audience */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-3">
              <h3 className="font-serif font-bold text-sm text-[#1E3A2B] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#2D6A4F]" />
                <span>1. Select Target Audience Segment</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#5A5043] mb-1">
                    Filter by Lead Stage
                  </label>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs font-semibold text-[#1E1C1A]"
                  >
                    <option value="All">All Lead Stages</option>
                    <option value="New Lead">New Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Quotation Sent">Quotation Sent</option>
                    <option value="Sample Sent">Sample Sent</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#5A5043] mb-1">
                    Filter by Product Interest
                  </label>
                  <select
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs font-semibold text-[#1E1C1A]"
                  >
                    <option value="All">All Bag Types</option>
                    <option value="Canvas Bags">Canvas Bags</option>
                    <option value="Cotton Tote">Cotton Tote</option>
                    <option value="Jute Bags">Jute Bags</option>
                    <option value="Potli Bags">Potli Bags</option>
                    <option value="Drawstring Pouches">Drawstring Pouches</option>
                    <option value="Jewellery Pouches">Jewellery Pouches</option>
                    <option value="Promotional Bags">Promotional Bags</option>
                    <option value="Custom Gifts">Custom Gifts</option>
                  </select>
                </div>
              </div>

              {/* Matched Count Pill */}
              <div className="p-3 rounded-xl bg-[#FAF5EB] border border-[#E8DFC9] flex items-center justify-between text-xs">
                <span className="text-[#5C4D3C] flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Matched Contacts in Database:</span>
                </span>
                <span className="font-mono font-bold text-sm text-[#1E3A2B]">
                  {targetAudience.length} leads
                </span>
              </div>
            </div>

            {/* 2. Choose Template & Message Body */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-3">
              <h3 className="font-serif font-bold text-sm text-[#1E3A2B] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2D6A4F]" />
                <span>2. Message Template & Customization</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {waTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplateChange(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      selectedTemplateId === t.id
                        ? 'bg-[#FAF5EB] border-[#2D6A4F] text-[#1E3A2B] font-bold ring-1 ring-[#2D6A4F]'
                        : 'bg-white border-[#DDD3C2] text-[#5C4D3C] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="block truncate">{t.name}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#5A5043] mb-1">
                  Editable Broadcast Body (Auto-replaces {'{name}'}, {'{product}'}, {'{quantity}'})
                </label>
                <textarea
                  rows={5}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs text-[#2D2A26] leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              {!isBroadcasting ? (
                <button
                  type="button"
                  onClick={handleStartBroadcast}
                  disabled={targetAudience.length === 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 min-h-[48px]"
                >
                  <Send className="w-4 h-4" />
                  <span>Start WhatsApp Dispatch Queue ({targetAudience.length} leads)</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#FAF5EB] border border-[#E8DFC9] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#2D6A4F]">Dispatch in progress...</span>
                    <span className="font-mono text-xs font-bold text-[#1E3A2B]">
                      {Object.keys(sentMap).length} / {targetAudience.length} Sent
                    </span>
                  </div>
                  <div className="w-full bg-[#E5DBC7] rounded-full h-2">
                    <div
                      className="bg-[#2D6A4F] h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(Object.keys(sentMap).length / targetAudience.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Interactive Broadcast Dispatch Queue */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-3 flex flex-col max-h-[680px]">
            <h3 className="font-serif font-bold text-sm text-[#1E3A2B] flex items-center justify-between">
              <span>Recipients Queue</span>
              <span className="text-[10px] font-mono text-[#8C7E6D]">
                {targetAudience.length} total
              </span>
            </h3>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1 text-xs">
              {targetAudience.length === 0 ? (
                <div className="py-12 text-center text-[#A09382] italic">
                  No customers match this filter.
                </div>
              ) : (
                targetAudience.map((cust, idx) => {
                  const isSent = Boolean(sentMap[cust.id]);
                  const isCurrent = isBroadcasting && currentIndex === idx;

                  return (
                    <div
                      key={cust.id}
                      className={`p-3 rounded-xl border transition space-y-1.5 ${
                        isCurrent
                          ? 'bg-[#FAF5EC] border-[#2D6A4F] ring-1 ring-[#2D6A4F]'
                          : isSent
                          ? 'bg-[#F0FDF4] border-emerald-200'
                          : 'bg-[#FAF8F5] border-[#E8DFC9]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-[#1E3A2B] truncate">{cust.name}</strong>
                        {isSent ? (
                          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sent</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#8C7E6D]">
                            #{idx + 1}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#5C4D3C] flex justify-between">
                        <span>{cust.contact_person || 'Client'}</span>
                        <span className="font-mono">{cust.whatsapp_number || cust.phone}</span>
                      </div>

                      {/* 1-Tap Direct Send Button */}
                      <button
                        type="button"
                        onClick={() => handleSendNext(cust, idx)}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                          isSent
                            ? 'bg-white border border-emerald-300 text-emerald-800'
                            : 'bg-[#059669] hover:bg-[#047857] text-white shadow-xs'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{isSent ? 'Resend WhatsApp' : 'Open WhatsApp & Next'}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* HISTORY TAB */
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1E3A2B] flex items-center gap-2">
            <History className="w-4 h-4 text-[#2D6A4F]" />
            <span>Past Broadcast Dispatch History</span>
          </h3>

          <div className="divide-y divide-[#EFE7D8] text-xs">
            {broadcastLogs.length === 0 ? (
              <div className="py-8 text-center text-[#8C7E6D] italic">
                No past broadcast logs recorded.
              </div>
            ) : (
              broadcastLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <strong className="text-sm text-[#1E3A2B] block">{log.template_name}</strong>
                    <p className="text-xs text-[#5C4D3C] mt-0.5">{log.filter_criteria}</p>
                    <span className="text-[10px] text-[#8C7E6D]">
                      Dispatched by {log.handled_by || 'Admin'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {log.target_count} recipients
                    </span>
                    <div className="text-[10px] font-mono text-[#8C7E6D] mt-1">
                      {new Date(log.sent_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
