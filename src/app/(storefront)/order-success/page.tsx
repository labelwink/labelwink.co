import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ order_id?: string, invoice?: string }> }) {
  const { order_id, invoice } = await searchParams;
  
  if (!order_id) {
    redirect('/');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*),
      invoices (invoice_number)
    `)
    .eq('id', order_id)
    .eq('user_id', user.id)
    .single();

  if (!order) {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6 animate-[scale-in_0.5s_ease-out]">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-heading font-bold text-charcoal mb-2">Order Placed Successfully! 🎉</h1>
        <p className="text-muted-foreground">
          Thank you, {order.customer_name?.split(' ')[0] || 'friend'}! Your order is confirmed.
        </p>
      </div>

      <div className="border border-[#c9a84c]/30 rounded-2xl p-6 bg-white shadow-sm mb-8">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-6 border-b border-sage/20">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Invoice #</p>
            <p className="font-mono font-bold text-[#c9a84c] text-lg">{order.invoices?.[0]?.invoice_number || invoice || 'Pending'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Order ID</p>
            <p className="font-bold text-sm">#{order.id.split('-')[0].toUpperCase()}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Date</p>
            <p className="font-bold text-sm">{new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Payment</p>
            <p className="font-bold text-sm">Razorpay ✅</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60">Items</h3>
          {order.order_items.map((item: any) => (
            <div key={item.id} className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-sage/10 rounded-md overflow-hidden flex-shrink-0">
                {item.product_image ? (
                <Image 
                  src={item.product_image} 
                  alt={item.product_name} 
                  fill
                  sizes="64px"
                  className="object-cover" 
                />
                ) : (
                  <div className="w-full h-full bg-sage/20" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-charcoal truncate">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">Size: {item.size || 'Free Size'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-charcoal">₹{item.total_price}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-sage/20 pt-6 space-y-2 mb-8">
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
          <div className="flex justify-between text-lg pt-4 border-t border-sage/20 mt-4">
            <span className="font-bold text-charcoal">Total</span>
            <span className="font-bold text-[#c9a84c]">₹{order.total}</span>
          </div>
        </div>

        <div className="bg-sage/5 rounded-xl p-4 border border-sage/10 mb-6">
          <h3 className="text-xs uppercase tracking-widest font-bold text-charcoal/60 mb-2">Delivery Address</h3>
          <p className="text-sm font-bold">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {order.shipping_address.line1}<br/>
            {order.shipping_address.line2 && <>{order.shipping_address.line2}<br/></>}
            {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
          </p>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          📧 Confirmation sent to <span className="font-bold text-charcoal">{order.customer_email}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href={`/account/orders/${order.id}`}
          className="flex-1 bg-white text-[#faf7f2] py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-center hover:bg-black transition-colors"
        >
          Track My Order
        </Link>
        <Link 
          href="/collections/all"
          className="flex-1 border-2 border-[#ffffff] text-[#ffffff] py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-center hover:bg-sage/5 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
