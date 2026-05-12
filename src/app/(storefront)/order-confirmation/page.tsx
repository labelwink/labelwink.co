// src/app/(storefront)/order-confirmation/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function OrderConfirmationPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ order_id?: string }> 
}) {
  const { order_id } = await searchParams;
  
  if (!order_id) {
    redirect('/');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Allow viewing if logged in as the owner
  let query = supabase
    .from('orders')
    .select(`
      *,
      invoices (invoice_number)
    `)
    // Support both internal UUID and friendly order_number (LBWK...)
    .or(`id.eq.${order_id},order_number.eq.${order_id}`);

  if (user) {
    query = query.eq('user_id', user.id);
  }

  const { data: order, error } = await query.single();

  if (error || !order) {
    console.error('[OrderConfirmation] Order not found:', order_id, error);
    redirect('/');
  }

  // Parse items if they are stored as JSONB
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-6 animate-bounce">✅</div>
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
          Order Placed Successfully!
        </h1>
        <p className="text-[#5a7060] mb-10 text-lg">
          Thank you for shopping with LabelWink. Your style is on its way!
        </p>
        
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 text-left mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-[#F0ECE6] pb-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#5a7060] font-semibold block mb-1">Order Number</span>
              <span className="text-xl font-bold text-[#1B3A2D]">{order.order_number}</span>
            </div>
            <div className="md:text-right">
              <span className="text-xs uppercase tracking-wider text-[#5a7060] font-semibold block mb-1">Invoice Number</span>
              <span className="text-lg font-medium text-[#1A1A1A]">{order.invoice_number || 'Processing...'}</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-sm uppercase tracking-wider font-bold text-[#1A1A1A] border-b border-[#F0ECE6] pb-2">Order Summary</h3>
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4 items-center py-2">
                <div className="w-16 h-20 bg-[#F5F2EC] rounded-lg overflow-hidden relative flex-shrink-0 border border-[#E8E2D9]">
                  {item.image ? (
                    <Image 
                      src={item.image} 
                      alt={item.name} 
                      fill 
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[#9aab9e]">No Image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1A1A1A] text-sm truncate">{item.name}</p>
                  <p className="text-xs text-[#5a7060] mt-1">Size: {item.size} • Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1B3A2D] text-sm">₹{item.price * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-[#F0ECE6] pt-6 mb-8">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#5a7060]">Subtotal</span>
              <span className="font-medium text-[#1A1A1A]">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#5a7060]">Shipping</span>
              <span className="font-medium text-[#1A1A1A]">{order.shipping_amount === 0 ? 'FREE' : `₹${order.shipping_amount}`}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between items-center text-sm text-green-600">
                <span>Discount</span>
                <span className="font-medium">-₹{order.discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xl pt-4 border-t border-[#1B3A2D]/10 mt-2">
              <span className="font-bold text-[#1A1A1A]">Total Paid</span>
              <span className="font-extrabold text-[#1B3A2D]">₹{order.total_amount}</span>
            </div>
          </div>

          <div className="bg-[#F0F7F4] rounded-xl p-5 border border-[#D1E7DD]">
            <h3 className="text-xs uppercase tracking-wider font-bold text-[#1B3A2D] mb-3">Delivery to</h3>
            <p className="text-sm font-bold text-[#1A1A1A]">{order.shipping_address.name || order.customer_name}</p>
            <p className="text-sm text-[#5a7060] mt-1 leading-relaxed">
              {order.shipping_address.line1}<br/>
              {order.shipping_address.line2 && <>{order.shipping_address.line2}<br/></>}
              {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
            </p>
            <div className="mt-4 pt-4 border-t border-[#1B3A2D]/10">
              <p className="text-[11px] text-[#1B3A2D] font-medium flex items-center gap-2">
                🚚 Estimated delivery within 5-7 business days.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/account/orders"
            className="px-8 py-4 bg-white border border-[#1B3A2D] text-[#1B3A2D] rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#F0ECE6] transition-all text-center"
          >
            View My Orders
          </Link>
          <Link 
            href="/products"
            className="px-8 py-4 bg-[#1B3A2D] text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#152e23] transition-all shadow-md text-center"
          >
            Continue Shopping
          </Link>
        </div>
        
        <p className="mt-12 text-sm text-[#5a7060]">
          A confirmation email has been sent to <span className="font-bold text-[#1A1A1A]">{order.customer_email}</span>
        </p>
      </div>
    </div>
  );
}
