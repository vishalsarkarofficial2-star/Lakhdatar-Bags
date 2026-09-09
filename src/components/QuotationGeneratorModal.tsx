import { useState, type FormEvent } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Printer,
  Share2,
  CheckCircle2,
  Building,
  Package,
  Calendar,
  IndianRupee,
  ShoppingBag,
} from 'lucide-react';
import { Customer, Quotation, QuotationItem, QuotationStatus, ProductInterest } from '../types';
import { formatINR, formatPhoneForWhatsApp } from '../utils/formatters';
import { getOffsetDate } from '../data/seedData';

interface QuotationGeneratorModalProps {
  customer: Customer;
  existingQuotation?: Quotation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (quotationData: Omit<Quotation, 'id' | 'created_at'>, existingId?: string) => Promise<void>;
  onConvertToOrder?: (quotation: Quotation) => void;
  currentUser?: string;
}

const BAG_PRODUCTS: ProductInterest[] = [
  'Canvas Bags',
  'Cotton Tote',
  'Jute Bags',
  'Potli Bags',
  'Drawstring Pouches',
  'Jewellery Pouches',
  'Promotional Bags',
  'Custom Gifts',
];

export function QuotationGeneratorModal({
  customer,
  existingQuotation,
  isOpen,
  onClose,
  onSave,
  onConvertToOrder,
  currentUser = 'Sales Desk',
}: QuotationGeneratorModalProps) {
  if (!isOpen) return null;

  const isEditing = Boolean(existingQuotation);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  const [quotationNumber, setQuotationNumber] = useState(
    existingQuotation?.quotation_number ||
      `LB-QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [status, setStatus] = useState<QuotationStatus>(existingQuotation?.status || 'Draft');
  const [validityDate, setValidityDate] = useState(
    existingQuotation?.validity_date || getOffsetDate(15)
  );
  const [terms, setTerms] = useState(
    existingQuotation?.terms ||
      '1. GST 5% extra as applicable.\n2. 50% advance with Purchase Order, balance before factory dispatch.\n3. Sample approved physical quality guaranteed.\n4. Delivery 7-10 working days from Delhi factory.'
  );

  // Parse quantity from customer if creating new
  const defaultQty = parseInt(customer.order_quantity?.replace(/\D/g, '') || '500', 10) || 500;

  const [items, setItems] = useState<QuotationItem[]>(() => {
    if (existingQuotation && existingQuotation.items.length > 0) {
      return existingQuotation.items;
    }
    return [
      {
        product_name: customer.product_interest || 'Canvas Bags',
        gsm_spec: 'Heavy GSM Fabric with high-density custom screen logo print',
        quantity: defaultQty,
        rate: 85,
        total: defaultQty * 85,
      },
    ];
  });

  const [saving, setSaving] = useState(false);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const totalAmount = subtotal;

  const handleItemChange = (index: number, field: keyof QuotationItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      if (field === 'quantity' || field === 'rate') {
        item.total = Number(item.quantity || 0) * Number(item.rate || 0);
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_name: 'Cotton Tote',
        gsm_spec: 'Custom logo printed bag',
        quantity: 500,
        rate: 65,
        total: 500 * 65,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await onSave(
        {
          quotation_number: quotationNumber,
          customer_id: customer.id,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          items,
          total_amount: totalAmount,
          status,
          validity_date: validityDate,
          terms,
          handled_by: currentUser,
        },
        existingQuotation?.id
      );
      setViewMode('preview');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = formatPhoneForWhatsApp(customer.whatsapp_number || customer.phone);
    const text = `Namaste ${customer.contact_person || customer.name} ji! 🙏
Here is your wholesale quotation *${quotationNumber}* from *Lakhdatar Bags Delhi*:

Total Amount: *${formatINR(totalAmount)}*
Valid Until: ${validityDate}

Items:
${items.map((i) => `• ${i.product_name} (${i.quantity} pcs @ ₹${i.rate}/pc) = ${formatINR(i.total)}`).join('\n')}

Terms: 50% advance to start production. Thank you!
- Lakhdatar Bags (Okhla Phase 2, New Delhi)`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 font-sans">
      <div
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl max-h-[96vh] flex flex-col shadow-2xl border border-[#E8DFC9] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFE7D8] bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#1E3A2B]">
                  {viewMode === 'edit' ? 'Quotation Generator' : 'Quotation Preview'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF1E0] text-[#8C6239] border border-[#ECD9BE] font-bold">
                  {quotationNumber}
                </span>
              </div>
              <p className="text-xs text-[#7A6E5F] truncate max-w-xs">
                {customer.name} • {customer.contact_person || 'Client'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
              className="px-3 py-1.5 rounded-xl border border-[#DDD3C2] text-xs font-semibold text-[#5C4D3C] hover:bg-[#F2EADA] transition"
            >
              {viewMode === 'edit' ? 'Preview PDF' : 'Edit Fields'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#EFE7D8] text-[#8C7E6D] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW 1: EDIT FORM */}
        {viewMode === 'edit' ? (
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 text-xs">
            {/* Status & Validity Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                  Quotation Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as QuotationStatus)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs font-semibold text-[#1E1C1A]"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent to Client</option>
                  <option value="Accepted">Accepted (Deal Won)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                  Validity Date
                </label>
                <input
                  type="date"
                  value={validityDate}
                  onChange={(e) => setValidityDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs font-mono text-[#1E1C1A]"
                />
              </div>
            </div>

            {/* Line Items Builder */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-bold text-[#2D6A4F] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>Itemized Bag Products & Rates</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-[11px] text-[#2D6A4F] font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC9] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={item.product_name}
                        onChange={(e) =>
                          handleItemChange(idx, 'product_name', e.target.value)
                        }
                        className="flex-1 p-2 rounded-xl bg-white border border-[#DDD3C2] text-xs font-bold text-[#1E1C1A]"
                      >
                        {BAG_PRODUCTS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={item.gsm_spec || ''}
                      onChange={(e) => handleItemChange(idx, 'gsm_spec', e.target.value)}
                      placeholder="Specifications (e.g. 16oz Canvas, 2-color screen print, 14x16 inch)"
                      className="w-full p-2 rounded-xl bg-white border border-[#DDD3C2] text-xs text-[#2D2A26] placeholder-[#A09382]"
                    />

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div>
                        <label className="block text-[10px] text-[#7A6E5F] mb-0.5">Quantity (pcs)</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full p-2 rounded-xl bg-white border border-[#DDD3C2] text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#7A6E5F] mb-0.5">Unit Rate (₹)</label>
                        <input
                          type="number"
                          min="1"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)
                          }
                          className="w-full p-2 rounded-xl bg-white border border-[#DDD3C2] text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#7A6E5F] mb-0.5">Total (₹)</label>
                        <div className="p-2 rounded-xl bg-[#F4EDE0] border border-[#DDD3C2] text-xs font-mono font-bold text-[#1E3A2B] text-right truncate">
                          {formatINR(item.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-3.5 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider opacity-80">
                  Total Quotation Value
                </span>
                <div className="text-xl font-bold font-mono">{formatINR(totalAmount)}</div>
              </div>
              <span className="text-xs opacity-90">{items.length} line item(s)</span>
            </div>

            {/* Terms & Conditions */}
            <div>
              <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                Terms & Conditions / Payment Milestones
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs leading-relaxed text-[#2D2A26]"
              />
            </div>

            {/* Submit Bar */}
            <div className="sticky bottom-0 pt-3 pb-1 bg-white border-t border-[#EFE7D8] flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#23553E] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60 min-h-[48px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Saving to Supabase...' : 'Save & Preview Quotation'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* VIEW 2: PDF-STYLE PRINTABLE QUOTATION VIEW */
          <div className="overflow-y-auto p-5 space-y-4 text-xs">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#FAF5EB] border border-[#E8DFC9] print:hidden">
              <span className="text-xs font-semibold text-[#5A4B3A]">
                Status: <span className="font-bold text-[#2D6A4F]">{status}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#23553E] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                {status === 'Accepted' && onConvertToOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      if (existingQuotation) {
                        onConvertToOrder(existingQuotation);
                      } else {
                        onConvertToOrder({
                          id: 'temp_quote',
                          quotation_number: quotationNumber,
                          customer_id: customer.id,
                          customer_name: customer.name,
                          customer_phone: customer.phone,
                          items,
                          total_amount: totalAmount,
                          status,
                          validity_date: validityDate,
                          created_at: new Date().toISOString(),
                        });
                      }
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Convert to Order</span>
                  </button>
                )}
              </div>
            </div>

            {/* Printable Document Box */}
            <div
              id="printable-quotation"
              className="bg-white p-6 rounded-2xl border-2 border-[#D8CBB6] shadow-sm space-y-5 text-[#2D2A26]"
            >
              {/* Header Branding */}
              <div className="border-b-2 border-[#2D6A4F] pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center font-serif font-bold text-lg">
                      LB
                    </div>
                    <h2 className="font-serif font-black text-xl text-[#1E3A2B] tracking-tight">
                      LAKHDATAR BAGS
                    </h2>
                  </div>
                  <p className="text-[11px] text-[#5C4D3C] mt-1 font-medium">
                    Manufacturer & Wholesale Supplier of Premium Customized Bags & Corporate Gifting
                  </p>
                  <p className="text-[10px] text-[#7A6E5F]">
                    Factory: Phase-2, Okhla Industrial Area, New Delhi - 110020
                  </p>
                  <p className="text-[10px] text-[#7A6E5F]">
                    GSTIN: <strong className="text-[#2D2A26]">07AAAAA0000A1Z5</strong> | Ph: +91 98112 34567 | info@lakhdatarbags.com
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded-lg bg-[#FAF5EB] border border-[#DDD3C2] text-xs font-bold text-[#2D6A4F] uppercase tracking-wider mb-1">
                    Commercial Quotation
                  </div>
                  <div className="font-mono font-bold text-xs text-[#1E3A2B]">{quotationNumber}</div>
                  <div className="text-[10px] text-[#7A6E5F]">
                    Date: {new Date().toLocaleDateString('en-IN')}
                  </div>
                  <div className="text-[10px] text-[#B45309] font-medium">
                    Valid Until: {validityDate}
                  </div>
                </div>
              </div>

              {/* Client Bill To */}
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE1D2]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8C7E6D] block">
                    Quotation Prepared For:
                  </span>
                  <strong className="text-sm text-[#1E3A2B] block">{customer.name}</strong>
                  <div className="text-xs text-[#5C4D3C]">{customer.contact_person}</div>
                  <div className="text-xs font-mono text-[#5C4D3C]">{customer.phone}</div>
                  {customer.email && <div className="text-xs text-[#5C4D3C]">{customer.email}</div>}
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#8C7E6D] block">
                    Sales Desk Representative:
                  </span>
                  <strong className="text-xs text-[#1E3A2B] block">{currentUser}</strong>
                  <div className="text-[11px] text-[#5C4D3C]">Delhi Manufacturing Division</div>
                  <div className="text-[11px] text-[#5C4D3C]">Ref: {customer.business_type} Wholesale</div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF5EB] text-[#2D6A4F] font-bold border-y border-[#DDD0BD]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product & Specification</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7D8]">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 px-3 font-mono text-[#8C7E6D]">{i + 1}</td>
                      <td className="py-3 px-3">
                        <strong className="text-[#1E3A2B] block text-xs">{item.product_name}</strong>
                        <span className="text-[11px] text-[#7A6E5F]">{item.gsm_spec}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {item.quantity.toLocaleString('en-IN')} pcs
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{formatINR(item.rate)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#1E3A2B]">
                        {formatINR(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#2D6A4F] font-bold text-sm bg-[#FAF8F5]">
                    <td colSpan={4} className="py-3 px-3 text-right uppercase text-xs text-[#5C4D3C]">
                      Total Net Amount:
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#1E3A2B] text-base">
                      {formatINR(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Terms & Conditions */}
              <div className="border-t border-[#EFE7D8] pt-3 text-[11px] text-[#5C4D3C] space-y-1">
                <strong className="text-[#1E3A2B] block uppercase text-[10px] tracking-wider">
                  Terms & Commercial Conditions:
                </strong>
                <p className="whitespace-pre-wrap leading-relaxed">{terms}</p>
              </div>

              {/* Footer Signatory */}
              <div className="pt-6 border-t border-[#EFE7D8] flex items-end justify-between text-[11px] text-[#7A6E5F]">
                <div>
                  <p>Computer generated quotation from Lakhdatar Bags CRM.</p>
                  <p>Subject to Delhi Jurisdiction.</p>
                </div>
                <div className="text-center">
                  <div className="font-serif font-bold text-xs text-[#1E3A2B] mb-1">
                    For Lakhdatar Bags Delhi
                  </div>
                  <div className="h-9 flex items-center justify-center font-mono italic text-[10px] text-[#8C7E6D]">
                    [Authorized Signatory]
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
