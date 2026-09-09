import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Phone,
  MessageSquare,
  Mail,
  Edit2,
  Trash2,
  Package,
  Calendar,
  Layers,
  List,
  Kanban,
  CheckCircle,
  Clock,
  User,
  FileText,
  FileCheck,
  Gift,
  Heart,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import {
  Customer,
  LeadStage,
  ProductInterest,
  UserRole,
  Quotation,
} from '../types';
import { formatDisplayDate } from '../utils/formatters';

interface CustomersViewProps {
  customers: Customer[];
  quotations?: Quotation[];
  initialStageFilter?: LeadStage | null;
  userRole?: UserRole;
  onAddLead: () => void;
  onEditLead: (customer: Customer) => void;
  onDeleteLead: (id: string, name: string) => void;
  onCallLead: (customer: Customer) => void;
  onWhatsAppLead: (customer: Customer) => void;
  onEmailLead: (customer: Customer) => void;
  onUpdateStage: (customer: Customer, newStage: LeadStage) => void;
  onCreateQuotation: (customer: Customer) => void;
  onViewQuotation?: (quotation: Quotation) => void;
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

const ALL_PRODUCTS: ProductInterest[] = [
  'Canvas Bags',
  'Cotton Tote',
  'Jute Bags',
  'Potli Bags',
  'Drawstring Pouches',
  'Jewellery Pouches',
  'Promotional Bags',
  'Custom Gifts',
];

const STAGE_BADGE_STYLE: Record<LeadStage, { bg: string; text: string; border: string }> = {
  'New Lead': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'Contacted': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  'Quotation Sent': { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-300' },
  'Sample Sent': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'Negotiation': { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-300' },
  'Order Confirmed': { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300' },
  'Lost': { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' },
};

export function CustomersView({
  customers,
  quotations = [],
  initialStageFilter = null,
  userRole = 'admin',
  onAddLead,
  onEditLead,
  onDeleteLead,
  onCallLead,
  onWhatsAppLead,
  onEmailLead,
  onUpdateStage,
  onCreateQuotation,
  onViewQuotation,
}: CustomersViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<LeadStage | 'ALL' | 'SAMPLES_PENDING'>(
    initialStageFilter || 'ALL'
  );
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Samples pending feedback count
  const samplesPendingCount = customers.filter(
    (c) => c.sample_sent_date && c.sample_feedback === 'Pending'
  ).length;

  // Filtered dataset
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        cust.name.toLowerCase().includes(query) ||
        (cust.contact_person && cust.contact_person.toLowerCase().includes(query)) ||
        cust.phone.includes(query) ||
        (cust.product_interest && cust.product_interest.toLowerCase().includes(query)) ||
        (cust.email && cust.email.toLowerCase().includes(query));

      // Stage or special filter match
      let matchesStage = true;
      if (selectedStage === 'SAMPLES_PENDING') {
        matchesStage = Boolean(cust.sample_sent_date && cust.sample_feedback === 'Pending');
      } else if (selectedStage !== 'ALL') {
        matchesStage = cust.lead_stage === selectedStage;
      }

      // Product match
      const matchesProduct =
        selectedProduct === 'ALL' || cust.product_interest === selectedProduct;

      return matchesQuery && matchesStage && matchesProduct;
    });
  }, [customers, searchQuery, selectedStage, selectedProduct]);

  return (
    <div className="w-full pb-28 md:pb-16 pt-2 space-y-4 font-sans">
      {/* Top Controls: Search Bar & View Mode Toggle */}
      <div className="sticky top-[60px] z-20 bg-[#FAF7F2]/95 backdrop-blur-md pb-3 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C7E6D]">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="customer-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, contact, phone, bag type..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-[#DDD3C2] text-sm text-[#1E1C1A] placeholder-[#9E9080] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#8C7E6D]"
              >
                ✕
              </button>
            )}
          </div>

          {/* List vs Kanban Toggle Button */}
          <div className="flex items-center bg-[#EFE8D8] p-1 rounded-xl border border-[#DFD3BE]">
            <button
              onClick={() => setViewMode('list')}
              title="Card List View"
              className={`p-2 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'text-[#5C4D3C] hover:bg-[#E5DBC7]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              title="Pipeline Kanban View"
              className={`p-2 rounded-lg transition ${
                viewMode === 'kanban'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'text-[#5C4D3C] hover:bg-[#E5DBC7]'
              }`}
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Stage Filters + Samples Pending Feedback Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          <button
            onClick={() => setSelectedStage('ALL')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition min-h-[36px] ${
              selectedStage === 'ALL'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'bg-white text-[#5C4D3C] border border-[#DDD3C2] hover:bg-[#F5EFE4]'
            }`}
          >
            All ({customers.length})
          </button>

          {/* Quick Filter: Samples Pending Feedback */}
          <button
            onClick={() => setSelectedStage('SAMPLES_PENDING')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition min-h-[36px] flex items-center gap-1.5 ${
              selectedStage === 'SAMPLES_PENDING'
                ? 'bg-[#8C6239] text-white shadow-xs'
                : 'bg-[#FAF5EB] text-[#8C6239] border border-[#EADBCA] hover:bg-[#F2E8D8]'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Samples Pending Feedback</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedStage === 'SAMPLES_PENDING'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#ECD9BE] text-[#633F17]'
              }`}
            >
              {samplesPendingCount}
            </span>
          </button>

          {ALL_STAGES.map((st) => {
            const count = customers.filter((c) => c.lead_stage === st).length;
            const isSelected = selectedStage === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStage(st)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition min-h-[36px] flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'bg-white text-[#5C4D3C] border border-[#DDD3C2] hover:bg-[#F5EFE4]'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#EFE8D8] text-[#5C4D3C]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Count Status */}
      <div className="flex items-center justify-between text-xs text-[#7A6E5F] px-1">
        <span>
          Showing <strong>{filteredCustomers.length}</strong> of {customers.length} customer records
        </span>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="text-xs bg-transparent border border-[#DDD3C2] rounded-lg px-2 py-1 text-[#5C4D3C] focus:outline-none"
        >
          <option value="ALL">All Bag Types</option>
          {ALL_PRODUCTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#E8DFC9]">
              <Package className="w-12 h-12 text-[#8C7E6D] mx-auto mb-2 opacity-50" />
              <h3 className="font-serif font-bold text-[#2D2A26] text-base">
                No matching customers found
              </h3>
              <p className="text-xs text-[#7A6E5F] mt-1">
                Try clearing your search filters or add a new customer inquiry.
              </p>
              <button
                onClick={onAddLead}
                className="mt-4 px-4 py-2.5 rounded-xl bg-[#2D6A4F] text-white text-xs font-semibold"
              >
                + Add New Lead
              </button>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isExpanded = expandedCardId === cust.id;
              const badgeStyle = STAGE_BADGE_STYLE[cust.lead_stage] || {
                bg: 'bg-gray-100',
                text: 'text-gray-800',
                border: 'border-gray-200',
              };

              // Quotations for this customer
              const customerQuotes = quotations.filter((q) => q.customer_id === cust.id);

              return (
                <div
                  key={cust.id}
                  id={`customer-card-${cust.id}`}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFC9] shadow-xs hover:border-[#2D6A4F]/40 transition space-y-3"
                >
                  {/* Top Line: Company Name & Stage Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-base text-[#1E3A2B] truncate">
                          {cust.name}
                        </h4>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#FAF5EB] text-[#785C38] border border-[#EADBCA] shrink-0">
                          {cust.business_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#5C4D3C] mt-0.5">
                        <User className="w-3.5 h-3.5 text-[#8C7E6D]" />
                        <span className="font-medium truncate">
                          {cust.contact_person || 'No contact person'}
                        </span>
                        <span className="text-[#BDB19F]">•</span>
                        <span className="font-mono text-[#7A6E5F]">{cust.phone}</span>
                      </div>
                    </div>

                    {/* Stage Badge */}
                    <div className="relative shrink-0">
                      <select
                        value={cust.lead_stage}
                        onChange={(e) => onUpdateStage(cust, e.target.value as LeadStage)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} appearance-none cursor-pointer pr-5 focus:outline-none`}
                        title="Click to change lead stage"
                      >
                        {ALL_STAGES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 pointer-events-none text-current opacity-70" />
                    </div>
                  </div>

                  {/* Product Interest & Bag Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF5EC] border border-[#EFE5D4] text-[#4A3B2C] font-medium">
                      <Package className="w-3.5 h-3.5 text-[#8C6D46]" />
                      <span>{cust.product_interest}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5EFE4] text-[#5C4D3C] font-mono">
                      <span>Qty:</span>
                      <strong className="text-[#1E3A2B]">{cust.order_quantity || 'Bulk'}</strong>
                    </span>

                    {/* Sample Tracker Pill */}
                    {cust.sample_sent_date && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          cust.sample_feedback === 'Approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : cust.sample_feedback === 'Revision Requested'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : cust.sample_feedback === 'Rejected'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}
                      >
                        <FileCheck className="w-3 h-3" />
                        <span>
                          Sample: {cust.sample_type || 'Sent'} (
                          {cust.sample_feedback || 'Pending'})
                        </span>
                      </span>
                    )}

                    {/* Catalog Link Pill */}
                    {cust.catalog_link && (
                      <a
                        href={cust.catalog_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:underline"
                      >
                        <span>Catalog Sent</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}

                    {/* Birthday / Anniversary Indicator */}
                    {cust.birthday && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-md border border-[#FDE68A]">
                        <Gift className="w-3 h-3" />
                        <span>B'day: {cust.birthday.substring(5)}</span>
                      </span>
                    )}
                  </div>

                  {/* Followup schedule info */}
                  {cust.next_followup_date && (
                    <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-[#FAF8F3] border border-[#EFE7D8]">
                      <div className="flex items-center gap-1.5 text-[#5C4D3C]">
                        <Clock className="w-3.5 h-3.5 text-[#C2410C]" />
                        <span>Next:</span>
                        <strong className="text-[#9A3412] font-medium">
                          {formatDisplayDate(cust.next_followup_date)} ({cust.followup_type})
                        </strong>
                      </div>
                      <span className="text-[11px] text-[#8C7E6D]">
                        Assigned: {cust.assigned_to || 'Rajesh'}
                      </span>
                    </div>
                  )}

                  {/* Quotations History preview against customer */}
                  {customerQuotes.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#FAF6EE] border border-[#EDE0CC] space-y-1.5 text-xs">
                      <span className="text-[10px] uppercase font-bold text-[#8C7E6D] block">
                        Saved Quotations ({customerQuotes.length})
                      </span>
                      <div className="space-y-1">
                        {customerQuotes.map((q) => (
                          <div
                            key={q.id}
                            className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#E4D9C5]"
                          >
                            <div>
                              <span className="font-mono font-bold text-[#2D6A4F]">
                                {q.quotation_number}
                              </span>
                              <span className="text-[10px] text-[#7A6E5F] ml-2">
                                Status: <strong className="text-[#1E3A2B]">{q.status}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#1E3A2B]">
                                ₹{q.total_amount.toLocaleString('en-IN')}
                              </span>
                              {onViewQuotation && (
                                <button
                                  type="button"
                                  onClick={() => onViewQuotation(q)}
                                  className="text-[11px] text-blue-700 font-semibold hover:underline"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-[#EDE5D6] space-y-2 text-xs text-[#5C4D3C]">
                      {cust.notes && (
                        <div>
                          <span className="font-semibold text-[#3D352B]">Notes: </span>
                          <span className="text-[#655848]">{cust.notes}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8C7E6D]">
                        <div>Email: {cust.email || 'None'}</div>
                        <div>WhatsApp: {cust.whatsapp_number || cust.phone}</div>
                        <div>Added: {formatDisplayDate(cust.created_at)}</div>
                        <div>Email Status: {cust.email_sent_status || 'Not Sent'}</div>
                      </div>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="pt-2 border-t border-[#F0E8DC] flex flex-wrap items-center justify-between gap-1.5">
                    {/* Primary communication buttons */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                      {/* Call Button */}
                      <button
                        onClick={() => onCallLead(cust)}
                        className="flex-1 py-2 px-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] font-semibold text-xs flex items-center justify-center gap-1 transition min-h-[44px]"
                        title="Call directly"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>

                      {/* WhatsApp Button */}
                      <button
                        onClick={() => onWhatsAppLead(cust)}
                        className="flex-1 py-2 px-2 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] font-semibold text-xs flex items-center justify-center gap-1 transition min-h-[44px]"
                        title="Send WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Create Quotation Button (NEW REQUEST 1) */}
                      <button
                        onClick={() => onCreateQuotation(cust)}
                        className="flex-1 py-2 px-2 rounded-xl bg-[#FAF5EB] hover:bg-[#F2EADA] text-[#8C6239] font-bold text-xs flex items-center justify-center gap-1 border border-[#ECD9BE] transition min-h-[44px]"
                        title="Generate wholesale quotation"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#2D6A4F]" />
                        <span>Quotation</span>
                      </button>
                    </div>

                    {/* Secondary Actions (Edit, Delete, Expand) */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditLead(cust)}
                        className="p-2.5 rounded-xl text-[#5C4D3C] hover:bg-[#FAF5EC] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Edit lead details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete button: only enabled for Admin role */}
                      {userRole === 'admin' ? (
                        <button
                          onClick={() => onDeleteLead(cust.id, cust.name)}
                          className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Delete customer (Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}

                      <button
                        onClick={() => setExpandedCardId(isExpanded ? null : cust.id)}
                        className="p-2.5 rounded-xl text-[#8C7E6D] hover:bg-[#FAF5EC] transition min-h-[44px] min-w-[36px] flex items-center justify-center"
                        title="Show full notes"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="w-full overflow-x-auto pb-4 pt-1 snap-x snap-mandatory">
          <div className="flex gap-3 min-w-max">
            {ALL_STAGES.map((stage) => {
              const stageCustomers = filteredCustomers.filter((c) => c.lead_stage === stage);
              const styling = STAGE_BADGE_STYLE[stage];

              return (
                <div
                  key={stage}
                  className="w-[300px] sm:w-[320px] bg-[#FAF8F5] rounded-2xl p-3 border border-[#E8DFC9] flex flex-col snap-center shrink-0"
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E8DFC9]">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${styling.bg} border ${styling.border}`} />
                      <h4 className="font-serif font-bold text-sm text-[#1E3A2B]">{stage}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-[#DDD3C2] text-[#5C4D3C]">
                      {stageCustomers.length}
                    </span>
                  </div>

                  {/* Cards inside column */}
                  <div className="space-y-2.5 flex-1 max-h-[65vh] overflow-y-auto pr-1">
                    {stageCustomers.length === 0 ? (
                      <div className="text-center py-8 text-xs text-[#A69784] border-2 border-dashed border-[#E8DFC9] rounded-xl">
                        No leads in {stage}
                      </div>
                    ) : (
                      stageCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          className="bg-white rounded-xl p-3 border border-[#E2D8C3] shadow-xs space-y-2 hover:border-[#2D6A4F] transition"
                        >
                          <div className="flex justify-between items-start gap-1">
                            <h5 className="font-semibold text-xs text-[#1E3A2B] leading-tight">
                              {cust.name}
                            </h5>
                            <button
                              onClick={() => onEditLead(cust)}
                              className="text-[#8C7E6D] hover:text-[#2D6A4F] p-1"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-[11px] text-[#5C4D3C]">
                            <div>{cust.contact_person} • {cust.phone}</div>
                            <div className="text-[#8C6D46] font-medium mt-0.5">
                              {cust.product_interest} ({cust.order_quantity || 'Bulk'})
                            </div>
                          </div>

                          {/* Quick Action Icons */}
                          <div className="pt-2 border-t border-[#F0E8DC] flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onCallLead(cust)}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                                title="Call"
                              >
                                <Phone className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onWhatsAppLead(cust)}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onCreateQuotation(cust)}
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                                title="Create Quotation"
                              >
                                <FileText className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Move stage dropdown */}
                            <select
                              value={cust.lead_stage}
                              onChange={(e) => onUpdateStage(cust, e.target.value as LeadStage)}
                              className="text-[10px] font-semibold bg-[#FAF5EC] border border-[#E0D4C0] rounded px-1 py-0.5 text-[#5C4D3C]"
                            >
                              {ALL_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  → {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        id="customers-fab-add-lead"
        onClick={onAddLead}
        className="fixed bottom-20 md:bottom-8 right-5 z-40 w-14 h-14 rounded-full bg-[#2D6A4F] hover:bg-[#23553E] active:scale-95 text-[#FAF7F2] shadow-lg flex items-center justify-center transition border-2 border-white/50"
        title="Add New Customer Lead"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>
    </div>
  );
}
