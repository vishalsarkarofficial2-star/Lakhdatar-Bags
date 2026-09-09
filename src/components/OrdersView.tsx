import { useState } from 'react';
import {
  ShoppingBag,
  Package,
  Calendar,
  Phone,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  Layers,
  Plus,
  Edit2,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { Order, OrderStatus, Product, UserRole } from '../types';
import { formatINR, formatDisplayDate, exportOrdersToCSV, formatPhoneForWhatsApp } from '../utils/formatters';

interface OrdersViewProps {
  orders: Order[];
  products: Product[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onUpdateProductStock: (productId: string, newStock: number) => Promise<void>;
  userRole?: UserRole;
  onCallCustomer?: (phone: string) => void;
  onWhatsAppCustomer?: (phone: string, text: string) => void;
}

const ORDER_STAGES: { status: OrderStatus; label: string; icon: any; color: string }[] = [
  { status: 'Confirmed', label: 'Confirmed', icon: CheckCircle2, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { status: 'In Production', label: 'In Production', icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { status: 'Ready to Dispatch', label: 'Ready to Dispatch', icon: Package, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { status: 'Dispatched', label: 'Dispatched', icon: Truck, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { status: 'Delivered', label: 'Delivered', icon: CheckCircle2, color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

export function OrdersView({
  orders,
  products,
  onUpdateOrderStatus,
  onUpdateProductStock,
  userRole = 'admin',
  onCallCustomer,
  onWhatsAppCustomer,
}: OrdersViewProps) {
  const [activeTab, setActiveTab] = useState<'kanban' | 'inventory'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [editingStockProduct, setEditingStockProduct] = useState<Product | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatusFilter === 'All' || o.order_status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'Confirmed':
        return 'In Production';
      case 'In Production':
        return 'Ready to Dispatch';
      case 'Ready to Dispatch':
        return 'Dispatched';
      case 'Dispatched':
        return 'Delivered';
      default:
        return null;
    }
  };

  const isNearingDelivery = (dateStr?: string) => {
    if (!dateStr) return false;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 3;
  };

  return (
    <div className="w-full pb-28 md:pb-16 pt-1 space-y-4 font-sans">
      {/* Top Header & Navigation Switcher */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFC9] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#1E3A2B] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#2D6A4F]" />
              <span>Production Orders & Bag Raw Inventory</span>
            </h2>
            <p className="text-xs text-[#7A6E5F]">
              Live batch status tracking with automated stock deductions upon dispatch
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF5EB] rounded-xl border border-[#EDE5D6] text-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`py-1.5 px-3 rounded-lg font-semibold transition ${
                activeTab === 'kanban'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'text-[#6B5A46] hover:bg-[#F2EADA]'
              }`}
            >
              Orders Pipeline ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-1.5 px-3 rounded-lg font-semibold transition ${
                activeTab === 'inventory'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'text-[#6B5A46] hover:bg-[#F2EADA]'
              }`}
            >
              Raw Stock Inventory ({products.length})
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        {activeTab === 'kanban' && (
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#EFE7D8]">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#8C7E6D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order number or client..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-xs text-[#2D2A26] placeholder-[#A09382] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs py-1">
              {(['All', 'Confirmed', 'In Production', 'Ready to Dispatch', 'Dispatched', 'Delivered'] as const).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition text-[11px] ${
                      selectedStatusFilter === st
                        ? 'bg-[#2D6A4F] text-white'
                        : 'bg-[#FAF5EB] text-[#5C4D3C] border border-[#E8DEC9] hover:bg-[#F0E6D5]'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}

              <button
                onClick={() => exportOrdersToCSV(orders)}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF5EC] border border-[#DDD0BC] text-[#6B5A46] hover:bg-[#F0E4D0] font-semibold text-[11px] flex items-center gap-1 transition ml-auto"
                title="Export CSV"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: ORDERS KANBAN (Mobile Swipeable Columns) */}
      {activeTab === 'kanban' && (
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[760px] md:min-w-0 md:grid md:grid-cols-5">
            {ORDER_STAGES.map((stage) => {
              const stageOrders = filteredOrders.filter((o) => o.order_status === stage.status);
              const StageIcon = stage.icon;

              return (
                <div
                  key={stage.status}
                  className="w-[280px] md:w-auto shrink-0 bg-[#FAF7F2] rounded-2xl p-3 border border-[#E8DEC9] flex flex-col space-y-3"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAE1D2]">
                    <div className="flex items-center gap-1.5">
                      <span className={`p-1 rounded-lg border ${stage.color}`}>
                        <StageIcon className="w-3.5 h-3.5" />
                      </span>
                      <h3 className="font-serif font-bold text-xs text-[#1E3A2B] truncate">
                        {stage.label}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white border border-[#DDD3C2] text-[#6B5A46]">
                      {stageOrders.length}
                    </span>
                  </div>

                  {/* Order Cards List */}
                  <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {stageOrders.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-[#A09382] italic">
                        No orders in this stage
                      </div>
                    ) : (
                      stageOrders.map((order) => {
                        const nextStatus = getNextStatus(order.order_status);
                        const isNearing = isNearingDelivery(order.expected_delivery_date);

                        return (
                          <div
                            key={order.id}
                            className="bg-white rounded-xl p-3.5 border border-[#E4DAC7] shadow-xs space-y-2.5 hover:border-[#2D6A4F] transition"
                          >
                            {/* Order Number & Amount */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-[#8C6239] bg-[#FAF5EB] px-2 py-0.5 rounded border border-[#EDE2CE]">
                                {order.order_number}
                              </span>
                              <span className="font-mono font-bold text-xs text-[#1E3A2B]">
                                {formatINR(order.total_amount)}
                              </span>
                            </div>

                            {/* Customer & Phone */}
                            <div>
                              <h4 className="font-serif font-bold text-xs text-[#1E3A2B] leading-tight">
                                {order.customer_name}
                              </h4>
                              {order.customer_phone && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono text-[#7A6E5F]">
                                    {order.customer_phone}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onCallCustomer) onCallCustomer(order.customer_phone!);
                                        else window.location.href = `tel:${order.customer_phone}`;
                                      }}
                                      className="p-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                                      title="Call"
                                    >
                                      <Phone className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const text = `Namaste ${order.customer_name} ji! Your order ${order.order_number} is currently ${order.order_status}. - Lakhdatar Bags`;
                                        if (onWhatsAppCustomer) onWhatsAppCustomer(order.customer_phone!, text);
                                        else {
                                          window.open(
                                            `https://wa.me/${formatPhoneForWhatsApp(order.customer_phone!)}?text=${encodeURIComponent(text)}`,
                                            '_blank'
                                          );
                                        }
                                      }}
                                      className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                      title="WhatsApp"
                                    >
                                      <MessageSquare className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Items preview */}
                            <div className="text-[11px] text-[#5C4D3C] bg-[#FAF8F5] p-2 rounded-lg border border-[#EDE5D6] space-y-0.5">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span className="truncate max-w-[140px]">{item.product_name}</span>
                                  <span className="font-mono font-bold text-[#1E3A2B]">
                                    {item.quantity} pcs
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Delivery Date Alert */}
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-[#8C7E6D]">Target Delivery:</span>
                              <span
                                className={`font-mono font-medium flex items-center gap-1 ${
                                  isNearing
                                    ? 'text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200'
                                    : 'text-[#4A3B2C]'
                                }`}
                              >
                                {isNearing && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                                <span>{formatDisplayDate(order.expected_delivery_date)}</span>
                              </span>
                            </div>

                            {/* Progression Button */}
                            {nextStatus && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, nextStatus)}
                                className={`w-full py-2 px-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition ${
                                  nextStatus === 'Dispatched'
                                    ? 'bg-[#059669] hover:bg-[#047857] text-white'
                                    : 'bg-[#2D6A4F] hover:bg-[#23553E] text-white'
                                }`}
                              >
                                <span>Advance to {nextStatus}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {order.order_status === 'Dispatched' && (
                              <div className="text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded-lg text-center font-medium border border-emerald-200">
                                ✓ Stock deducted from Raw Inventory
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: RAW STOCK INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE7D8] pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1E3A2B]">
                Bag Fabric & Raw Stock Warehouse
              </h3>
              <p className="text-xs text-[#7A6E5F]">
                Real-time stock counts. When an order is marked "Dispatched", the quantity automatically decreases here.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {products.map((prod) => {
              const isLowStock = prod.stock_quantity < 500;
              return (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE0CF] space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-[#8C6D46] bg-[#FAF1E0] px-2 py-0.5 rounded border border-[#ECD9BE]">
                        {prod.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLowStock
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-xs text-[#1E3A2B] line-clamp-2">
                      {prod.product_name}
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#7A6E5F]">Available Stock:</span>
                      <span className="font-mono font-bold text-lg text-[#1E3A2B]">
                        {prod.stock_quantity.toLocaleString('en-IN')}{' '}
                        <span className="text-xs font-normal text-[#8C7E6D]">{prod.unit}</span>
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs text-[#7A6E5F]">
                      <span>Base Wholesale Rate:</span>
                      <span className="font-mono font-semibold text-[#2D6A4F]">
                        {formatINR(prod.unit_price)} / {prod.unit}
                      </span>
                    </div>
                  </div>

                  {userRole === 'admin' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStockProduct(prod);
                        setNewStockVal(prod.stock_quantity);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-[#DDD3C2] hover:bg-[#F5EFE4] text-xs font-semibold text-[#5C4D3C] flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit2 className="w-3 h-3 text-[#8C7E6D]" />
                      <span>Adjust Stock</span>
                    </button>
                  ) : (
                    <div className="text-[10px] text-center text-[#8C7E6D] italic">
                      Staff View (Admin edit only)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {editingStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-[#E8DFC9] space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-[#EFE7D8]">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#1E3A2B]">Adjust Stock Quantity</h4>
                <p className="text-[11px] text-[#7A6E5F] truncate max-w-[220px]">
                  {editingStockProduct.product_name}
                </p>
              </div>
              <button onClick={() => setEditingStockProduct(null)} className="p-1 text-[#8C7E6D]">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#5A5043] mb-1">
                New Available Stock ({editingStockProduct.unit})
              </label>
              <input
                type="number"
                min="0"
                value={newStockVal}
                onChange={(e) => setNewStockVal(parseInt(e.target.value, 10) || 0)}
                className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#DDD3C2] text-sm font-mono font-bold text-[#1E1C1A]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  await onUpdateProductStock(editingStockProduct.id, newStockVal);
                  setEditingStockProduct(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#2D6A4F] text-white font-semibold text-xs transition"
              >
                Save Stock
              </button>
              <button
                type="button"
                onClick={() => setEditingStockProduct(null)}
                className="px-4 py-2.5 rounded-xl bg-[#FAF5EB] text-[#5C4D3C] text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
