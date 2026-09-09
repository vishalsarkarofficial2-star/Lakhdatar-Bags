import { Customer, Template, Order, Quotation } from '../types';

/**
 * Format phone number for tel: link (strip spaces, dashes)
 */
export function formatPhoneForTel(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Format phone for wa.me link (must have country code, no + or spaces)
 */
export function formatPhoneForWhatsApp(whatsappNumber: string): string {
  let cleaned = whatsappNumber.replace(/\D/g, '');
  // If Indian 10-digit number without 91, prepend 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Replace placeholders like {name}, {product}, {quantity}, {company}
 */
export function renderTemplate(
  templateBody: string,
  customer: Partial<Customer>
): string {
  let text = templateBody;
  const name = customer.contact_person || customer.name || 'Sir/Madam';
  const company = customer.name || '';
  const product = customer.product_interest || 'customized bags';
  const quantity = customer.order_quantity || 'bulk order';

  text = text.replace(/{name}/g, name);
  text = text.replace(/{company}/g, company);
  text = text.replace(/{product}/g, product);
  text = text.replace(/{quantity}/g, quantity);

  return text;
}

/**
 * Indian Rupee Currency Formatter (₹)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Format date for display (e.g., "08 Sep 2026", "Today", "Tomorrow", "Yesterday")
 */
export function formatDisplayDate(dateString?: string | null): string {
  if (!dateString) return 'No date set';
  try {
    const target = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const check = new Date(target);
    check.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (check.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    return target.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Export customers list as a downloadable CSV file
 */
export function exportCustomersToCSV(customers: Customer[]): void {
  if (!customers || customers.length === 0) {
    alert('No customer records to export.');
    return;
  }

  const headers = [
    'ID',
    'Company / Name',
    'Contact Person',
    'Phone',
    'WhatsApp',
    'Email',
    'Business Type',
    'Product Interest',
    'Order Quantity',
    'Lead Source',
    'Lead Stage',
    'Assigned Sales Person',
    'Next Followup Date',
    'Followup Type',
    'Sample Sent Date',
    'Sample Type',
    'Sample Feedback',
    'Catalog Link',
    'Birthday',
    'Anniversary',
    'Notes',
    'Created Date',
  ];

  const rows = customers.map((c) => [
    `"${c.id}"`,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.contact_person || '').replace(/"/g, '""')}"`,
    `"${c.phone || ''}"`,
    `"${c.whatsapp_number || ''}"`,
    `"${c.email || ''}"`,
    `"${c.business_type || ''}"`,
    `"${c.product_interest || ''}"`,
    `"${c.order_quantity || ''}"`,
    `"${c.lead_source || ''}"`,
    `"${c.lead_stage || ''}"`,
    `"${(c.assigned_to || '').replace(/"/g, '""')}"`,
    `"${c.next_followup_date || ''}"`,
    `"${c.followup_type || ''}"`,
    `"${c.sample_sent_date || ''}"`,
    `"${c.sample_type || ''}"`,
    `"${c.sample_feedback || ''}"`,
    `"${c.catalog_link || ''}"`,
    `"${c.birthday || ''}"`,
    `"${c.anniversary || ''}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
    `"${c.created_at || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(
    csvContent,
    `Lakhdatar_Bags_Customers_${new Date().toISOString().split('T')[0]}.csv`
  );
}

/**
 * Export orders list as a downloadable CSV file
 */
export function exportOrdersToCSV(orders: Order[]): void {
  if (!orders || orders.length === 0) {
    alert('No order records to export.');
    return;
  }

  const headers = [
    'Order Number',
    'Customer Name',
    'Customer Phone',
    'Items Summary',
    'Total Amount (INR)',
    'Order Status',
    'Expected Delivery Date',
    'Handled By',
    'Notes',
    'Created Date',
  ];

  const rows = orders.map((o) => {
    const itemsSummary = o.items
      .map((i) => `${i.product_name} (${i.quantity} @ Rs.${i.rate})`)
      .join('; ');
    return [
      `"${o.order_number}"`,
      `"${(o.customer_name || '').replace(/"/g, '""')}"`,
      `"${o.customer_phone || ''}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      o.total_amount,
      `"${o.order_status}"`,
      `"${o.expected_delivery_date || ''}"`,
      `"${(o.handled_by || '').replace(/"/g, '""')}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`,
      `"${o.created_at || ''}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(
    csvContent,
    `Lakhdatar_Bags_Orders_${new Date().toISOString().split('T')[0]}.csv`
  );
}

/**
 * Export quotations list as a downloadable CSV file
 */
export function exportQuotationsToCSV(quotations: Quotation[]): void {
  if (!quotations || quotations.length === 0) {
    alert('No quotation records to export.');
    return;
  }

  const headers = [
    'Quotation Number',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Items Summary',
    'Total Amount (INR)',
    'Status',
    'Validity Date',
    'Handled By',
    'Created Date',
  ];

  const rows = quotations.map((q) => {
    const itemsSummary = q.items
      .map((i) => `${i.product_name} (Qty: ${i.quantity}, Rate: Rs.${i.rate})`)
      .join('; ');
    return [
      `"${q.quotation_number}"`,
      `"${(q.customer_name || '').replace(/"/g, '""')}"`,
      `"${q.customer_phone || ''}"`,
      `"${q.customer_email || ''}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      q.total_amount,
      `"${q.status}"`,
      `"${q.validity_date || ''}"`,
      `"${(q.handled_by || '').replace(/"/g, '""')}"`,
      `"${q.created_at || ''}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(
    csvContent,
    `Lakhdatar_Bags_Quotations_${new Date().toISOString().split('T')[0]}.csv`
  );
}

function downloadBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Suggest next followup date and type based on lead stage
 */
export function getAutoFollowupSuggestion(stage: string): {
  days: number;
  type: 'Call' | 'WhatsApp' | 'Email';
  reason: string;
} {
  switch (stage) {
    case 'New Lead':
      return { days: 0, type: 'Call', reason: 'Immediate call discovery for new inquiry' };
    case 'Contacted':
      return { days: 1, type: 'WhatsApp', reason: 'Send catalog & quotation options' };
    case 'Quotation Sent':
      return { days: 2, type: 'WhatsApp', reason: 'Follow up on quotation feedback' };
    case 'Sample Sent':
      return { days: 3, type: 'Call', reason: 'Check sample delivery & fabric review' };
    case 'Negotiation':
      return { days: 1, type: 'Call', reason: 'Finalize quantity pricing & delivery timeline' };
    case 'Order Confirmed':
      return { days: 5, type: 'Email', reason: 'Production proof & invoice dispatch' };
    case 'Lost':
      return { days: 30, type: 'WhatsApp', reason: 'Re-engagement offer next month' };
    default:
      return { days: 2, type: 'Call', reason: 'Routine lead followup' };
  }
}
