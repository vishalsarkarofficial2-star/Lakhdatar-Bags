import { useState, useEffect, type FormEvent } from 'react';
import {
  X,
  Save,
  Building2,
  User,
  Phone,
  MessageSquare,
  Mail,
  Package,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Gift,
  Heart,
  FileCheck,
} from 'lucide-react';
import {
  Customer,
  BusinessType,
  ProductInterest,
  LeadSource,
  LeadStage,
  FollowupType,
  SampleFeedback,
} from '../types';
import { getAutoFollowupSuggestion, formatPhoneForWhatsApp } from '../utils/formatters';
import { getOffsetDate } from '../data/seedData';

interface CustomerFormModalProps {
  initialCustomer?: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id' | 'created_at'>, existingId?: string) => Promise<void>;
}

const BUSINESS_TYPES: BusinessType[] = ['Corporate', 'Retailer', 'Individual', 'Reseller'];

const PRODUCT_INTERESTS: ProductInterest[] = [
  'Canvas Bags',
  'Cotton Tote',
  'Jute Bags',
  'Potli Bags',
  'Drawstring Pouches',
  'Jewellery Pouches',
  'Promotional Bags',
  'Custom Gifts',
];

const LEAD_SOURCES: LeadSource[] = [
  'Instagram',
  'Website',
  'Referral',
  'Walk-in',
  'Trade Show',
  'Indiamart',
];

const LEAD_STAGES: LeadStage[] = [
  'New Lead',
  'Contacted',
  'Quotation Sent',
  'Sample Sent',
  'Negotiation',
  'Order Confirmed',
  'Lost',
];

const SAMPLE_FEEDBACK_OPTIONS: SampleFeedback[] = [
  'Pending',
  'Approved',
  'Revision Requested',
  'Rejected',
];

export function CustomerFormModal({
  initialCustomer,
  isOpen,
  onClose,
  onSave,
}: CustomerFormModalProps) {
  if (!isOpen) return null;

  const isEditing = Boolean(initialCustomer);

  const [name, setName] = useState(initialCustomer?.name || '');
  const [contactPerson, setContactPerson] = useState(initialCustomer?.contact_person || '');
  const [phone, setPhone] = useState(initialCustomer?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialCustomer?.whatsapp_number || '');
  const [email, setEmail] = useState(initialCustomer?.email || '');
  const [businessType, setBusinessType] = useState<BusinessType>(
    initialCustomer?.business_type || 'Corporate'
  );
  const [productInterest, setProductInterest] = useState<ProductInterest>(
    initialCustomer?.product_interest || 'Canvas Bags'
  );
  const [orderQuantity, setOrderQuantity] = useState(initialCustomer?.order_quantity || '500 pcs');
  const [leadSource, setLeadSource] = useState<LeadSource>(
    initialCustomer?.lead_source || 'Website'
  );
  const [leadStage, setLeadStage] = useState<LeadStage>(
    initialCustomer?.lead_stage || 'New Lead'
  );
  const [assignedTo, setAssignedTo] = useState(initialCustomer?.assigned_to || 'Rajesh Sharma');
  const [notes, setNotes] = useState(initialCustomer?.notes || '');
  const [nextFollowupDate, setNextFollowupDate] = useState(
    initialCustomer?.next_followup_date || getOffsetDate(0)
  );
  const [followupType, setFollowupType] = useState<FollowupType>(
    initialCustomer?.followup_type || 'Call'
  );

  // New fields: Sample tracker & Catalog
  const [sampleSentDate, setSampleSentDate] = useState(initialCustomer?.sample_sent_date || '');
  const [sampleType, setSampleType] = useState(initialCustomer?.sample_type || '');
  const [sampleFeedback, setSampleFeedback] = useState<SampleFeedback>(
    initialCustomer?.sample_feedback || 'Pending'
  );
  const [catalogLink, setCatalogLink] = useState(
    initialCustomer?.catalog_link || 'https://lakhdatarbags.com/catalog-2026.pdf'
  );

  // Relationship nurturing dates
  const [birthday, setBirthday] = useState(initialCustomer?.birthday || '');
  const [anniversary, setAnniversary] = useState(initialCustomer?.anniversary || '');

  const [sameAsPhone, setSameAsPhone] = useState(
    !initialCustomer?.whatsapp_number || initialCustomer.whatsapp_number === initialCustomer.phone
  );
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-sync WhatsApp if same as phone
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (sameAsPhone) {
      setWhatsappNumber(val);
    }
  };

  // Auto-suggest next followup date and channel when stage changes (if creating new)
  const handleStageChange = (newStage: LeadStage) => {
    setLeadStage(newStage);
    if (!isEditing) {
      const suggestion = getAutoFollowupSuggestion(newStage);
      setNextFollowupDate(getOffsetDate(suggestion.days));
      setFollowupType(suggestion.type);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Please enter Customer or Company Name.');
      return;
    }
    if (!phone.trim()) {
      setValidationError('Please enter Phone Number.');
      return;
    }

    setSaving(true);
    setValidationError(null);

    try {
      await onSave(
        {
          name: name.trim(),
          contact_person: contactPerson.trim(),
          phone: phone.trim(),
          whatsapp_number: whatsappNumber.trim() || phone.trim(),
          email: email.trim(),
          business_type: businessType,
          product_interest: productInterest,
          order_quantity: orderQuantity.trim(),
          lead_source: leadSource,
          lead_stage: leadStage,
          assigned_to: assignedTo.trim(),
          notes: notes.trim(),
          next_followup_date: nextFollowupDate,
          followup_type: followupType,
          sample_sent_date: sampleSentDate || null,
          sample_type: sampleType.trim() || null,
          sample_feedback: sampleSentDate ? sampleFeedback : null,
          catalog_link: catalogLink.trim() || null,
          birthday: birthday || null,
          anniversary: anniversary || null,
          last_contacted_at: initialCustomer?.last_contacted_at || null,
          email_sent_status: initialCustomer?.email_sent_status || 'Not Sent',
          email_sent_at: initialCustomer?.email_sent_at || null,
        },
        initialCustomer?.id
      );
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Error saving to Supabase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 font-sans">
      <div
        className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl max-h-[95vh] flex flex-col shadow-2xl border border-[#E8DFC9] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFE7D8] bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#1E3A2B]">
                {isEditing ? 'Edit Customer Details' : 'Add New Customer Lead'}
              </h3>
              <p className="text-xs text-[#7A6E5F]">
                Lakhdatar Bags • Syncs instantly to Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#EFE7D8] text-[#8C7E6D] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable stacked inputs) */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 text-xs">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {validationError}
            </div>
          )}

          {/* Company / Customer Name */}
          <div>
            <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
              Customer / Company Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DLF CyberCity Corp Gifts or Ramesh Jewellers"
              className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] placeholder-[#A09382] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>

          {/* Contact Person & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                Contact Person Name
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] placeholder-[#A09382] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                Phone Number (Calls) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+91 98101 23456"
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] placeholder-[#A09382] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
          </div>

          {/* WhatsApp & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-[#4A3E31] uppercase tracking-wider text-[10px]">
                  WhatsApp Number
                </label>
                <label className="text-[10px] text-[#2D6A4F] flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => {
                      setSameAsPhone(e.target.checked);
                      if (e.target.checked) setWhatsappNumber(phone);
                    }}
                    className="rounded text-[#2D6A4F]"
                  />
                  <span>Same as Phone</span>
                </label>
              </div>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => {
                  setWhatsappNumber(e.target.value);
                  setSameAsPhone(false);
                }}
                placeholder="+91 98101 23456"
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] placeholder-[#A09382] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="procurement@company.com"
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] placeholder-[#A09382] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
          </div>

          {/* Business Type & Product Interest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                Business Type
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              >
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                Product Interest
              </label>
              <select
                value={productInterest}
                onChange={(e) => setProductInterest(e.target.value as ProductInterest)}
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              >
                {PRODUCT_INTERESTS.map((pi) => (
                  <option key={pi} value={pi}>
                    {pi}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Order Quantity & Lead Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                Order Quantity / Bulk Spec
              </label>
              <input
                type="text"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                placeholder="e.g. 1,000 pcs or 5,000 pouches"
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] placeholder-[#A09382] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                Lead Source Channel
              </label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              >
                {LEAD_SOURCES.map((ls) => (
                  <option key={ls} value={ls}>
                    {ls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lead Stage & Assigned Sales Rep */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                Lead Stage Pipeline
              </label>
              <select
                value={leadStage}
                onChange={(e) => handleStageChange(e.target.value as LeadStage)}
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              >
                {LEAD_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                Assigned Sales Rep
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm text-[#1E1C1A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
          </div>

          {/* SAMPLE & CATALOG TRACKER SECTION */}
          <div className="p-3.5 rounded-2xl bg-[#F6F9F6] border border-[#D5E5D5] space-y-3">
            <span className="font-semibold text-xs text-[#1E3A2B] flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#2D6A4F]" />
              <span>Sample & Digital Catalog Tracker</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-[#4A5D4E] mb-1">Sample Sent Date</label>
                <input
                  type="date"
                  value={sampleSentDate}
                  onChange={(e) => setSampleSentDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#C5D8C5] text-xs font-mono text-[#1E3A2B]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#4A5D4E] mb-1">Sample Bag Type</label>
                <input
                  type="text"
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  placeholder="e.g. Canvas Tote 14x16"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#C5D8C5] text-xs text-[#1E3A2B]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#4A5D4E] mb-1">Sample Feedback</label>
                <select
                  value={sampleFeedback}
                  onChange={(e) => setSampleFeedback(e.target.value as SampleFeedback)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#C5D8C5] text-xs text-[#1E3A2B] font-semibold"
                >
                  {SAMPLE_FEEDBACK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#4A5D4E] mb-1">Digital Catalog Link</label>
              <input
                type="url"
                value={catalogLink}
                onChange={(e) => setCatalogLink(e.target.value)}
                placeholder="https://lakhdatarbags.com/catalog.pdf"
                className="w-full p-2.5 rounded-xl bg-white border border-[#C5D8C5] text-xs font-mono text-[#1E3A2B]"
              />
            </div>
          </div>

          {/* Next Followup Scheduling (Auto-suggested) */}
          <div className="p-3.5 rounded-2xl bg-[#FAF5EB] border border-[#E8DFC9] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#1E3A2B] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Next Followup Schedule</span>
              </span>
              <span className="text-[10px] text-[#8C7E6D]">
                Auto-calculated for {leadStage}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#6B5C4B] mb-1">Due Date</label>
                <input
                  type="date"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DDD3C2] text-xs font-mono text-[#2D2A26]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#6B5C4B] mb-1">Followup Method</label>
                <select
                  value={followupType}
                  onChange={(e) => setFollowupType(e.target.value as FollowupType)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DDD3C2] text-xs text-[#2D2A26]"
                >
                  <option value="Call">Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                </select>
              </div>
            </div>
          </div>

          {/* Birthday & Anniversary (Relationship Nurturing) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Gift className="w-3 h-3 text-[#B45309]" />
                <span>Contact Birthday (Optional)</span>
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs font-mono text-[#1E1C1A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500" />
                <span>Anniversary (Optional)</span>
              </label>
              <input
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs font-mono text-[#1E1C1A]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
              Requirement Notes / Custom Specs
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fabric GSM, handle type (cotton/jute/ribbon), logo print technique (screen/sublimation/foil), target delivery date..."
              className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs text-[#2D2A26] placeholder-[#A09382] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>

          {/* Sticky Save Button at Bottom */}
          <div className="sticky bottom-0 pt-3 pb-1 bg-white border-t border-[#EFE7D8]">
            <button
              id="customer-form-save-button"
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#23553E] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60 min-h-[48px]"
            >
              {saving ? (
                <span>Writing to Supabase...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create & Schedule Lead'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
