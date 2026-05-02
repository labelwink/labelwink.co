'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Helper to convert numbers to words for rupees
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees';
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  
  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
  };
  return convert(Math.floor(num)).trim() + ' Rupees Only';
}

export default function CustomerInvoice() {
  const { id } = useParams();
  const supabase = createClient();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchInvoice() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [orderRes, settingsRes] = await Promise.all([
        supabase.from('orders').select('*, order_items(*), invoices(*)').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('shop_settings').select('*').single()
      ]);
      if (orderRes.data && settingsRes.data) {
        setData({ order: orderRes.data, settings: settingsRes.data });
      }
    }
    fetchInvoice();
  }, [id, supabase]);

  if (!data) return <div className="p-20 text-center font-mono">Loading Invoice...</div>;

  const { order, settings } = data;
  const invoice = order.invoices?.[0];

  return (
    <div className="bg-white min-h-screen text-black">
      {/* Chrome (Hidden in print) */}
      <div className="print:hidden p-4 bg-gray-100 flex justify-between items-center border-b">
        <Link href={`/account/orders/${order.id}`} className="text-sm font-bold uppercase hover:underline">← Back to Order</Link>
        <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 text-sm font-bold uppercase rounded">Print Invoice</button>
      </div>

      <div className="max-w-4xl mx-auto p-8 font-sans">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
          <div>
            {settings.logo_url ? <img src={settings.logo_url} alt="Logo" className="h-12 mb-2" /> : <h1 className="text-2xl font-bold uppercase">{settings.store_name}</h1>}
            <p className="text-sm whitespace-pre-wrap">{settings.store_address}</p>
            <p className="text-sm">GSTIN: <span className="font-bold">{settings.gst_number}</span></p>
            <p className="text-sm">Phone: {settings.store_phone}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase tracking-widest">Tax Invoice</h2>
            <p className="text-sm mt-2">Invoice #: <span className="font-bold">{invoice?.invoice_number || 'Pending'}</span></p>
            <p className="text-sm">Date: {new Date(invoice?.created_at || order.created_at).toLocaleDateString('en-IN')}</p>
            <p className="text-sm">Order ID: {order.id.slice(0,8).toUpperCase()}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="font-bold bg-gray-200 p-2 uppercase text-xs">Billed To / Shipped To</h3>
          <div className="p-2 text-sm">
            <p className="font-bold">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
            <p>{order.shipping_address?.line1}</p>
            {order.shipping_address?.line2 && <p>{order.shipping_address?.line2}</p>}
            <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}</p>
            <p className="mt-1">Phone: {order.shipping_address?.phone || order.customer_phone}</p>
            <p>Email: {order.customer_email}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="bg-gray-200 border border-gray-300 uppercase text-xs">
              <th className="p-2 border border-gray-300 text-left">#</th>
              <th className="p-2 border border-gray-300 text-left">Description</th>
              <th className="p-2 border border-gray-300 text-center">HSN</th>
              <th className="p-2 border border-gray-300 text-center">Qty</th>
              <th className="p-2 border border-gray-300 text-right">Rate</th>
              <th className="p-2 border border-gray-300 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item: any, i: number) => (
              <tr key={item.id} className="border border-gray-300">
                <td className="p-2 border border-gray-300">{i+1}</td>
                <td className="p-2 border border-gray-300 font-medium">
                  {item.product_name}
                  <div className="text-xs text-gray-500 font-normal">
                    {item.size && `Size: ${item.size}`} {item.color && `| Color: ${item.color}`}
                  </div>
                </td>
                <td className="p-2 border border-gray-300 text-center">6104</td> {/* Placeholder HSN for apparel */}
                <td className="p-2 border border-gray-300 text-center">{item.quantity}</td>
                <td className="p-2 border border-gray-300 text-right">₹{item.unit_price}</td>
                <td className="p-2 border border-gray-300 text-right">₹{item.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm border border-gray-300 p-4">
            <div className="flex justify-between"><span>Subtotal:</span> <span>₹{order.subtotal}</span></div>
            <div className="flex justify-between"><span>Shipping:</span> <span>₹{order.shipping_amount}</span></div>
            {order.discount_amount > 0 && <div className="flex justify-between text-green-700"><span>Discount:</span> <span>-₹{order.discount_amount}</span></div>}
            <div className="flex justify-between border-t pt-2 border-gray-200"><span>Taxable Value:</span> <span>₹{order.subtotal + order.shipping_amount - order.discount_amount - order.tax_amount}</span></div>
            <div className="flex justify-between"><span>IGST:</span> <span>₹{order.tax_amount}</span></div> {/* Using IGST as proxy for now */}
            <div className="flex justify-between font-bold border-t border-black pt-2 text-lg"><span>Grand Total:</span> <span>₹{order.total}</span></div>
          </div>
        </div>

        {/* Words & Payment */}
        <div className="text-sm mb-12">
          <p><strong>Amount in Words:</strong> {numberToWords(order.total)}</p>
          <p className="mt-2"><strong>Payment Mode:</strong> Razorpay (Paid) <br/><span className="text-xs text-gray-600">TXN: {order.razorpay_payment_id}</span></p>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500 border-t border-gray-300 pt-4 text-center whitespace-pre-wrap">
          <p className="font-bold text-black mb-2">{settings.invoice_footer_note || 'Thank you for shopping with us!'}</p>
          <p>{settings.invoice_terms || 'All disputes are subject to local jurisdiction.'}</p>
        </div>
      </div>
    </div>
  );
}
