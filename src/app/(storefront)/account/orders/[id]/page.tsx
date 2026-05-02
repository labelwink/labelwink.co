'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, Download, RefreshCcw, Package, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const supabase = createClient();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [returnReason, setReturnReason] = useState('');
  const [returnDesc, setReturnDesc] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);
  
  useEffect(() => {
    async function fetchOrder() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          invoices (invoice_number),
          order_status_history (status, created_at, notes)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (data) {
        setOrder(data);
      }
      setLoading(false);
    }
    fetchOrder();
  }, [id, supabase]);

  if (loading) {
    return <div className="h-[40vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!order) {
    return <div className="text-center py-20">Order not found or unauthorized.</div>;
  }

  const steps = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
  let currentStepIdx = steps.indexOf(order.status);
  if (currentStepIdx === -1) {
    if (order.status === 'cancelled') currentStepIdx = -1; // Handle cancelled explicitly if needed
    if (order.status === 'dispatched') currentStepIdx = 3;
    if (order.status === 'order_ready') currentStepIdx = 2;
  }

  const isDelivered = order.status === 'delivered';
  // Simplified logic, normally from shop_settings
  const returnWindowDays = 7;
  const daysSinceOrder = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 3600 * 24));
  const canReturn = isDelivered && daysSinceOrder <= returnWindowDays;

  const handleReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReturn(true);
    // Submit to hypothetical returns endpoint or update status
    await new Promise(r => setTimeout(r, 1000));
    setReturnSuccess(true);
    setSubmittingReturn(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-4 border-b border-sage/20 pb-4">
        <Link href="/account/orders" className="p-2 hover:bg-sage/10 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-heading font-bold">Order #{order.id.slice(0,8).toUpperCase()}</h1>
      </div>

      {/* 1. Timeline */}
      {order.status !== 'cancelled' ? (
        <div className="bg-white border border-sage/20 rounded-xl p-6 mb-6 overflow-x-auto">
          <div className="min-w-[500px] flex justify-between items-center relative px-4">
            <div className="absolute top-4 left-8 right-8 h-1 bg-sage/20 -z-10"></div>
            <div className="absolute top-4 left-8 h-1 bg-[#c9a84c] -z-10 transition-all duration-500" style={{ width: `calc(${Math.max(0, currentStepIdx) * (100 / (steps.length - 1))}%) - 32px` }}></div>
            
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const historyLog = order.order_status_history?.find((h: any) => h.status === step || (step==='shipped' && h.status==='dispatched') || (step==='packed' && h.status==='order_ready'));
              
              return (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white transition-colors duration-500 ${isCompleted ? 'bg-[#c9a84c] text-white' : 'bg-sage/30'} ${isCurrent ? 'ring-4 ring-[#c9a84c]/20' : ''}`}>
                    {isCompleted ? <div className="w-2 h-2 rounded-full bg-white"></div> : null}
                  </div>
                  <div className="text-center">
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${isCompleted ? 'text-charcoal' : 'text-muted-foreground'}`}>{step}</p>
                    {historyLog && (
                      <p className="text-[9px] text-muted-foreground">{new Date(historyLog.created_at).toLocaleDateString('en-IN', {month:'short', day:'numeric'})}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6 font-bold text-center uppercase tracking-widest text-sm">
          This order was cancelled
        </div>
      )}

      {/* 2. Items */}
      <div className="bg-white border border-sage/20 rounded-xl overflow-hidden mb-6">
        <div className="bg-sage/5 px-6 py-3 border-b border-sage/10">
          <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60">Items</h3>
        </div>
        <div className="divide-y divide-sage/10">
          {order.order_items.map((item: any) => (
            <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-20 h-20 bg-sage/10 rounded-md overflow-hidden flex-shrink-0">
                {item.product_image && <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-charcoal mb-1">{item.product_name}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {item.size && <p>Size: {item.size}</p>}
                  {item.color && <p>Color: {item.color}</p>}
                  <p>Qty: {item.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-charcoal">₹{item.total_price}</p>
                <p className="text-[10px] text-muted-foreground">₹{item.unit_price} each</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. Tracking */}
        {order.tracking_number && (
          <div className="bg-white border border-sage/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[#c9a84c]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60">Shipping Info</h3>
                <p className="font-bold text-charcoal">{order.shipping_carrier}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Tracking Number: <span className="font-mono text-charcoal bg-sage/10 px-1 py-0.5">{order.tracking_number}</span></p>
            {order.tracking_url && (
              <a href={order.tracking_url} target="_blank" rel="noreferrer" className="text-xs text-teal font-bold tracking-widest uppercase hover:underline">Track Package →</a>
            )}
          </div>
        )}

        {/* 4. Address */}
        <div className="bg-sage/5 border border-sage/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60">Delivery Address</h3>
          </div>
          <p className="font-bold text-sm text-charcoal">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {order.shipping_address?.line1}<br/>
            {order.shipping_address?.line2 && <>{order.shipping_address.line2}<br/></>}
            {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
          </p>
        </div>
      </div>

      {/* 5. Totals */}
      <div className="bg-white border border-sage/20 rounded-xl p-6 max-w-sm ml-auto space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-bold">₹{order.subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-bold">{order.shipping_amount === 0 ? 'FREE' : `₹${order.shipping_amount}`}</span>
        </div>
        {order.discount_amount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span className="font-bold">-₹{order.discount_amount}</span>
          </div>
        )}
        {order.tax_amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST</span>
            <span className="font-bold">₹{order.tax_amount}</span>
          </div>
        )}
        <div className="flex justify-between text-lg pt-4 border-t border-sage/20 font-bold">
          <span className="text-charcoal">Total</span>
          <span className="text-[#c9a84c]">₹{order.total}</span>
        </div>
      </div>

      {/* 6. Buttons */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-sage/20" id="return">
        <Link 
          href={`/account/orders/${order.id}/invoice`}
          className="flex items-center gap-2 border border-[#1a1a1a] px-6 py-3 rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-sage/5 transition-colors"
        >
          <Download className="w-4 h-4" /> Download Invoice
        </Link>
        
        {canReturn && !returnSuccess && (
          <form onSubmit={handleReturnRequest} className="w-full mt-4 bg-white border border-red-200 rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-red-600 mb-4">Request Return</h3>
            <div className="space-y-4 max-w-md">
              <select required value={returnReason} onChange={e=>setReturnReason(e.target.value)} className="w-full border-sage/30 rounded-lg text-sm">
                <option value="" disabled>Select Reason...</option>
                <option value="wrong_size">Wrong size</option>
                <option value="damaged">Damaged product</option>
                <option value="wrong_product">Wrong product</option>
                <option value="not_described">Not as described</option>
                <option value="changed_mind">Changed my mind</option>
                <option value="other">Other</option>
              </select>
              <textarea placeholder="Additional description (optional)" value={returnDesc} onChange={e=>setReturnDesc(e.target.value)} className="w-full border-sage/30 rounded-lg text-sm h-24"></textarea>
              <button disabled={submittingReturn} className="bg-red-50 text-red-600 border border-red-200 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-100">
                {submittingReturn ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
        {returnSuccess && (
          <div className="w-full mt-4 bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl text-sm font-medium">
            ✅ Return request submitted. We'll contact you within 24 hours.
          </div>
        )}
      </div>
    </div>
  );
}
