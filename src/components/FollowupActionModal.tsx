import { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Mail,
  Phone,
  Send,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Customer, Template, FollowupType } from '../types';
import {
  formatPhoneForWhatsApp,
  formatPhoneForTel,
  renderTemplate,
} from '../utils/formatters';

interface FollowupActionModalProps {
  customer: Customer | null;
  mode: FollowupType | null; // 'WhatsApp' | 'Email' | 'Call'
  templates: Template[];
  isOpen: boolean;
  onClose: () => void;
  onLoggedSuccess: (
    customerId: string,
    type: FollowupType,
    outcome: string,
    notes: string
  ) => Promise<void>;
  onEmailStatusUpdated: (customerId: string) => Promise<void>;
}

export function FollowupActionModal({
  customer,
  mode,
  templates,
  isOpen,
  onClose,
  onLoggedSuccess,
  onEmailStatusUpdated,
}: FollowupActionModalProps) {
  if (!isOpen || !customer || !mode) return null;

  // Filter templates for current mode
  const relevantTemplates = templates.filter(
    (t) => t.type.toLowerCase() === mode.toLowerCase()
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    relevantTemplates[0]?.id || ''
  );
  const [subject, setSubject] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [autoLogDone, setAutoLogDone] = useState(true);
  const [copied, setCopied] = useState(false);

  // Update text when template or customer changes
  useEffect(() => {
    const tmpl = relevantTemplates.find((t) => t.id === selectedTemplateId) || relevantTemplates[0];
    if (tmpl) {
      setSelectedTemplateId(tmpl.id);
      const renderedBody = renderTemplate(tmpl.message_body, customer);
      setMessageText(renderedBody);
      if (tmpl.subject) {
        setSubject(renderTemplate(tmpl.subject, customer));
      }
    } else {
      setMessageText('');
      setSubject('');
    }
  }, [selectedTemplateId, customer, mode]);

  // Handle WhatsApp action
  const handleLaunchWhatsApp = async () => {
    const phone = customer.whatsapp_number || customer.phone;
    const cleanPhone = formatPhoneForWhatsApp(phone);
    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    // Open WhatsApp link in new tab / mobile app
    window.open(waUrl, '_blank');

    if (autoLogDone) {
      await onLoggedSuccess(
        customer.id,
        'WhatsApp',
        'Quotation Requested',
        `Sent WhatsApp: "${messageText.substring(0, 80)}..."`
      );
    }
    onClose();
  };

  // Handle Email action
  const handleLaunchEmail = async () => {
    const to = customer.email;
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(messageText);
    const mailtoUrl = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;

    window.open(mailtoUrl, '_blank');

    // Update email sent status in Supabase
    await onEmailStatusUpdated(customer.id);

    if (autoLogDone) {
      await onLoggedSuccess(
        customer.id,
        'Email',
        'Interested',
        `Sent Email subject: "${subject}"`
      );
    }
    onClose();
  };

  // Handle Call action
  const handleLaunchCall = async () => {
    const telUrl = `tel:${formatPhoneForTel(customer.phone)}`;
    window.location.href = telUrl;
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E8DFC9] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFE7D8]">
          <div className="flex items-center gap-2.5">
            {mode === 'WhatsApp' && (
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            )}
            {mode === 'Email' && (
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
            )}
            {mode === 'Call' && (
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-serif font-bold text-base text-[#1E3A2B] leading-tight">
                {mode === 'WhatsApp' && 'Send WhatsApp Followup'}
                {mode === 'Email' && 'Compose Email Followup'}
                {mode === 'Call' && 'Direct Phone Call'}
              </h3>
              <p className="text-xs text-[#7A6E5F]">
                {customer.name} • {customer.contact_person || 'Client'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F5EFE4] text-[#8C7E6D] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-4 text-xs">
          {/* Target Info Pill */}
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE5D6] flex items-center justify-between">
            <span className="text-[#5C4D3C] font-medium">
              Target {mode === 'Email' ? 'Email' : 'Number'}:
            </span>
            <span className="font-mono font-bold text-[#1E3A2B]">
              {mode === 'Email'
                ? customer.email || 'No email provided'
                : mode === 'WhatsApp'
                ? customer.whatsapp_number || customer.phone
                : customer.phone}
            </span>
          </div>

          {/* Template Picker */}
          {relevantTemplates.length > 0 && (
            <div>
              <label className="block font-semibold text-[#5A5043] mb-1.5 uppercase tracking-wider text-[10px]">
                Choose Template (Ready in Supabase)
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {relevantTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      selectedTemplateId === t.id
                        ? 'bg-[#FAF5EB] border-[#2D6A4F] text-[#1E3A2B] font-semibold'
                        : 'bg-white border-[#E8DFC9] text-[#5C4D3C] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    {selectedTemplateId === t.id && (
                      <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Email Subject Line (if Email) */}
          {mode === 'Email' && (
            <div>
              <label className="block font-semibold text-[#5A5043] mb-1.5 uppercase tracking-wider text-[10px]">
                Email Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs font-medium text-[#2D2A26] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
          )}

          {/* Editable Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-[#5A5043] uppercase tracking-wider text-[10px]">
                {mode === 'Call' ? 'Call Talking Points & Script' : 'Personalized Message (Editable)'}
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] text-[#2D6A4F] font-semibold flex items-center gap-1 hover:underline"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              rows={mode === 'Call' ? 4 : 6}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs text-[#2D2A26] leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
            <p className="text-[11px] text-[#8C7E6D] mt-1">
              Placeholders like {'{name}'} and {'{product}'} have been auto-populated with client details.
            </p>
          </div>

          {/* Checkbox: Auto-record followup log */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="auto-log-checkbox"
              type="checkbox"
              checked={autoLogDone}
              onChange={(e) => setAutoLogDone(e.target.checked)}
              className="rounded border-[#DDD3C2] text-[#2D6A4F] focus:ring-[#2D6A4F] w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="auto-log-checkbox"
              className="text-xs text-[#5C4D3C] cursor-pointer"
            >
              Automatically record this action to Supabase followup logs
            </label>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="p-4 border-t border-[#EFE7D8] bg-[#FAF8F5] flex flex-col gap-2">
          {mode === 'WhatsApp' && (
            <button
              onClick={handleLaunchWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition min-h-[48px]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open in WhatsApp Mobile App</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          )}

          {mode === 'Email' && (
            <button
              onClick={handleLaunchEmail}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition min-h-[48px]"
            >
              <Mail className="w-4 h-4" />
              <span>Open in Email App & Send</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          )}

          {mode === 'Call' && (
            <button
              onClick={handleLaunchCall}
              className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition min-h-[48px]"
            >
              <Phone className="w-4 h-4" />
              <span>Dial Call Now ({customer.phone})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
