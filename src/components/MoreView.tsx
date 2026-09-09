import { useState, type FormEvent } from 'react';
import {
  FileText,
  Download,
  Database,
  RefreshCw,
  LogOut,
  ShoppingBag,
  Check,
  Copy,
  Edit2,
  Shield,
  Save,
  Package,
  FileSpreadsheet,
} from 'lucide-react';
import { Customer, Template, FollowupLog, Order, Quotation, UserRole } from '../types';
import {
  exportCustomersToCSV,
  exportOrdersToCSV,
  exportQuotationsToCSV,
} from '../utils/formatters';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  isSupabaseConfigured,
  resetToDemoData,
} from '../services/supabase';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseSchema';

interface MoreViewProps {
  customers: Customer[];
  templates: Template[];
  followupLogs: FollowupLog[];
  orders?: Order[];
  quotations?: Quotation[];
  userRole: UserRole;
  onToggleUserRole?: (newRole: UserRole) => void;
  onSaveTemplate: (tmpl: Template) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onLogout: () => void;
}

export function MoreView({
  customers,
  templates,
  followupLogs,
  orders = [],
  quotations = [],
  userRole,
  onToggleUserRole,
  onSaveTemplate,
  onRefreshData,
  onLogout,
}: MoreViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'export' | 'roles' | 'supabase' | 'about'>('templates');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'whatsapp' | 'email' | 'call'>('all');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Supabase config state
  const creds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseKey, setSupabaseKey] = useState(creds.key);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const isConnected = isSupabaseConfigured();

  const handleSaveCredentials = (e: FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    setSaveStatus('Supabase settings saved! Reloading connection...');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleResetData = async () => {
    if (confirm('Reset all demo customers, orders, quotations, and products to default factory seed?')) {
      resetToDemoData();
      await onRefreshData();
      alert('Reset complete! Factory database re-seeded.');
    }
  };

  const filteredTemplates = templates.filter(
    (t) => templateFilter === 'all' || t.type === templateFilter
  );

  return (
    <div className="w-full pb-28 md:pb-16 pt-2 space-y-4 font-sans">
      {/* Top Title Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFC9] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#1E3A2B]">
              Settings & Administration
            </h2>
            <p className="text-xs text-[#7A6E5F]">
              Role permissions, templates, CSV exports, and Supabase cloud engine
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Sub-tab pills */}
        <div className="grid grid-cols-5 gap-1 mt-4 p-1 bg-[#FAF5EB] rounded-xl border border-[#EFE5D4] text-xs">
          <button
            onClick={() => setActiveSubTab('templates')}
            className={`py-2 px-1 rounded-lg font-semibold transition min-h-[38px] truncate ${
              activeSubTab === 'templates'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#6B5A46] hover:bg-[#F2EADA]'
            }`}
          >
            Templates
          </button>

          <button
            onClick={() => setActiveSubTab('export')}
            className={`py-2 px-1 rounded-lg font-semibold transition min-h-[38px] truncate ${
              activeSubTab === 'export'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#6B5A46] hover:bg-[#F2EADA]'
            }`}
          >
            Exports
          </button>

          <button
            onClick={() => setActiveSubTab('roles')}
            className={`py-2 px-1 rounded-lg font-semibold transition min-h-[38px] truncate ${
              activeSubTab === 'roles'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#6B5A46] hover:bg-[#F2EADA]'
            }`}
          >
            RBAC Roles
          </button>

          <button
            onClick={() => setActiveSubTab('supabase')}
            className={`py-2 px-1 rounded-lg font-semibold transition min-h-[38px] flex items-center justify-center gap-1 truncate ${
              activeSubTab === 'supabase'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#6B5A46] hover:bg-[#F2EADA]'
            }`}
          >
            <span>Supabase</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </button>

          <button
            onClick={() => setActiveSubTab('about')}
            className={`py-2 px-1 rounded-lg font-semibold transition min-h-[38px] truncate ${
              activeSubTab === 'about'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#6B5A46] hover:bg-[#F2EADA]'
            }`}
          >
            About
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: TEMPLATES MANAGER */}
      {activeSubTab === 'templates' && (
        <div className="space-y-3">
          {/* Template filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setTemplateFilter('all')}
              className={`px-3 py-1.5 rounded-full font-medium transition min-h-[36px] ${
                templateFilter === 'all'
                  ? 'bg-[#2D6A4F] text-white'
                  : 'bg-white border border-[#DDD3C2] text-[#5C4D3C]'
              }`}
            >
              All ({templates.length})
            </button>
            <button
              onClick={() => setTemplateFilter('whatsapp')}
              className={`px-3 py-1.5 rounded-full font-medium transition min-h-[36px] ${
                templateFilter === 'whatsapp'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-emerald-200 text-emerald-800'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setTemplateFilter('email')}
              className={`px-3 py-1.5 rounded-full font-medium transition min-h-[36px] ${
                templateFilter === 'email'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-amber-200 text-amber-800'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setTemplateFilter('call')}
              className={`px-3 py-1.5 rounded-full font-medium transition min-h-[36px] ${
                templateFilter === 'call'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-blue-200 text-blue-800'
              }`}
            >
              Call Scripts
            </button>
          </div>

          {/* Template Cards List */}
          <div className="space-y-3">
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFC9] shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        tmpl.type === 'whatsapp'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : tmpl.type === 'email'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {tmpl.type}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#1E3A2B]">
                      {tmpl.name}
                    </h4>
                  </div>

                  <button
                    onClick={() => setEditingTemplate(tmpl)}
                    className="p-2 rounded-xl text-[#2D6A4F] hover:bg-[#FAF5EC] transition min-h-[38px] flex items-center gap-1 text-xs font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                {tmpl.subject && (
                  <div className="text-xs font-medium text-[#4A3B2C] bg-[#FAF8F5] p-2 rounded-lg border border-[#EDE5D6]">
                    <span className="text-[#8C7E6D]">Subject: </span>
                    {tmpl.subject}
                  </div>
                )}

                <p className="text-xs text-[#5C5245] bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE5D6] whitespace-pre-wrap font-sans leading-relaxed">
                  {tmpl.message_body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CSV EXPORTS */}
      {activeSubTab === 'export' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-4">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1E3A2B] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#2D6A4F]" />
                <span>Export Business Data to CSV</span>
              </h3>
              <p className="text-xs text-[#7A6E5F] mt-1">
                Generate clean, spreadsheet-ready CSV exports for Excel, Google Sheets, or Tally bookkeeping.
              </p>
            </div>

            {/* Customers Export */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EDE5D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-[#1E3A2B]">Customer Leads & Contacts</h4>
                <p className="text-[11px] text-[#7A6E5F]">
                  {customers.length} records • Phone numbers, pipeline stages, sample feedback, bag interests.
                </p>
              </div>
              <button
                onClick={() => exportCustomersToCSV(customers)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#23553E] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Customers CSV</span>
              </button>
            </div>

            {/* Orders Export */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EDE5D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-[#1E3A2B]">Production & Dispatched Orders</h4>
                <p className="text-[11px] text-[#7A6E5F]">
                  {orders.length} orders • Order numbers, customer names, delivery deadlines, billing totals.
                </p>
              </div>
              <button
                onClick={() => exportOrdersToCSV(orders)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#23553E] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Orders CSV</span>
              </button>
            </div>

            {/* Quotations Export */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EDE5D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-[#1E3A2B]">Wholesale Quotations Registry</h4>
                <p className="text-[11px] text-[#7A6E5F]">
                  {quotations.length} quotations • Quote numbers, item specifications, validity dates, status.
                </p>
              </div>
              <button
                onClick={() => exportQuotationsToCSV(quotations)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#23553E] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Quotations CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RBAC ROLES (ADMIN VS STAFF) */}
      {activeSubTab === 'roles' && (
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-4">
          <div>
            <h3 className="font-serif font-bold text-base text-[#1E3A2B] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2D6A4F]" />
              <span>Role-Based Access Control (RBAC)</span>
            </h3>
            <p className="text-xs text-[#7A6E5F] mt-1">
              Test and enforce distinct permissions for Factory Owners (Admin) and Sales Representatives (Staff).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF5EB] border border-[#EADBCA] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C7E6D]">Current Session Role</span>
                <p className="font-bold text-sm text-[#1E3A2B] capitalize flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      userRole === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                    }`}
                  />
                  <span>{userRole === 'admin' ? 'Administrator (Full Access)' : 'Staff (Sales Team)'}</span>
                </p>
              </div>

              {onToggleUserRole && (
                <button
                  onClick={() => onToggleUserRole(userRole === 'admin' ? 'staff' : 'admin')}
                  className="px-3.5 py-2 rounded-xl bg-[#2D6A4F] text-white font-semibold text-xs transition hover:bg-[#23553E]"
                >
                  Switch to {userRole === 'admin' ? 'Staff Role' : 'Admin Role'}
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-[#EADBCA] grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 bg-white rounded-lg border border-[#E0D4C0] space-y-1">
                <span className="font-bold text-[#2D6A4F] block">Admin Privileges:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[#5C4D3C]">
                  <li>View Executive Reports & Revenue Analytics</li>
                  <li>Permanently delete customer records</li>
                  <li>Edit raw stock inventory levels</li>
                  <li>Access Supabase backend SQL migration</li>
                </ul>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E0D4C0] space-y-1">
                <span className="font-bold text-[#1D4ED8] block">Staff Privileges:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[#5C4D3C]">
                  <li>View & create customer inquiries</li>
                  <li>Log call, WhatsApp & email followups</li>
                  <li>Generate quotations & WhatsApp shares</li>
                  <li>Track orders & update delivery status</li>
                  <li className="text-red-600 font-medium">Restricted from reports & deletions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SUPABASE CONFIGURATION & SCHEMA */}
      {activeSubTab === 'supabase' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1E3A2B] flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Supabase Backend Connection</span>
                </h3>
                <p className="text-xs text-[#7A6E5F] mt-1">
                  Connect directly to your hosted Supabase Cloud project.
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>{isConnected ? 'Connected' : 'Table Engine (Local)'}</span>
              </span>
            </div>

            {saveStatus && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {saveStatus}
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                  Project URL
                </label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs font-mono text-[#2D2A26] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A3E31] mb-1 uppercase tracking-wider text-[10px]">
                  Anon Public Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs font-mono text-[#2D2A26] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#23553E] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition min-h-[44px]"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Supabase Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSqlModal(true)}
                  className="py-3 px-4 rounded-xl bg-[#FAF5EB] hover:bg-[#F2E7D5] border border-[#DDD0BC] text-[#4A3B2C] font-semibold text-xs flex items-center justify-center gap-1.5 transition min-h-[44px]"
                >
                  <FileText className="w-4 h-4 text-[#8C6D46]" />
                  <span>View SQL Migration Script</span>
                </button>
              </div>
            </form>
          </div>

          {/* Seed Data Reset Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#1E3A2B]">
                  Reset Factory Demo Dataset
                </h4>
                <p className="text-xs text-[#7A6E5F]">
                  Re-populates realistic bag wholesale leads, stock levels, orders, and quotations.
                </p>
              </div>
              <button
                onClick={handleResetData}
                className="px-3.5 py-2 rounded-xl bg-[#FAF5EC] hover:bg-[#F0E4D0] border border-[#DDD0BC] text-[#6B5A46] font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo Seed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: ABOUT */}
      {activeSubTab === 'about' && (
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-3 text-xs text-[#5C4D3C]">
          <div className="flex items-center gap-3 pb-3 border-b border-[#EFE7D8]">
            <div className="w-12 h-12 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#1E3A2B]">
                Lakhdatar Bags Delhi
              </h3>
              <p className="text-xs text-[#7A6E5F]">
                Manufacturer & Bulk Corporate Gifting Supplier
              </p>
            </div>
          </div>

          <p className="leading-relaxed">
            Direct manufacturers of customized canvas bags, cotton tote bags, eco-friendly jute bags, potli bags, drawstring pouches, jewellery pouches, promotional conference bags, and personalized corporate gift items.
          </p>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE5D6] space-y-1 text-[11px]">
            <div><strong>Factory Location:</strong> Okhla Industrial Area, Phase 2, New Delhi - 110020</div>
            <div><strong>Production Capabilities:</strong> Custom screen printing, digital transfer, foil stamping, heavy GSM stitching.</div>
            <div><strong>Authorized User:</strong> lakhdatarbags (Admin)</div>
          </div>
        </div>
      )}

      {/* Template Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#E8DFC9] p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2 border-[#EFE7D8]">
              <h3 className="font-serif font-bold text-base text-[#1E3A2B]">
                Edit Template: {editingTemplate.name}
              </h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1 text-[#8C7E6D]"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-[#5A5043] mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={editingTemplate.name}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, name: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs"
              />
            </div>

            {editingTemplate.type === 'email' && (
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#5A5043] mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={editingTemplate.subject || ''}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold uppercase text-[#5A5043] mb-1">
                Message Body (Supports {'{name}'}, {'{product}'}, {'{quantity}'})
              </label>
              <textarea
                rows={6}
                value={editingTemplate.message_body}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    message_body: e.target.value,
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={async () => {
                  await onSaveTemplate(editingTemplate);
                  setEditingTemplate(null);
                }}
                className="flex-1 py-3 rounded-xl bg-[#2D6A4F] text-white font-semibold text-xs"
              >
                Save Template to Supabase
              </button>
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-3 rounded-xl bg-[#FAF5EB] text-[#5C4D3C] text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Migration Script Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border border-[#E8DFC9] p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2 border-[#EFE7D8]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1E3A2B]">
                  Supabase SQL Schema Script
                </h3>
                <p className="text-[11px] text-[#7A6E5F]">
                  Run this in your Supabase project's SQL Editor
                </p>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1 text-[#8C7E6D]"
              >
                ✕
              </button>
            </div>

            <pre className="flex-1 overflow-y-auto p-3 rounded-xl bg-[#1E1C1A] text-[#EDE5D6] font-mono text-[10px] leading-relaxed select-all">
              {SUPABASE_SQL_SCHEMA}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopySql}
                className="py-2.5 px-4 rounded-xl bg-[#2D6A4F] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy Entire SQL'}</span>
              </button>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[#FAF5EB] text-[#5C4D3C] text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
