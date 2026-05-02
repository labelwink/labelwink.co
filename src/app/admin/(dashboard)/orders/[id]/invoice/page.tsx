import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { rupeeToWords, formatIndianCurrency, formatInvoiceDate } from '@/lib/invoice-helpers';
import PrintButton from '@/components/admin/PrintButton';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [
    { data: order },
    { data: invoice },
    { data: settings }
  ] = await Promise.all([
    supabase.from('orders').select('*, order_items(*)').eq('id', id).single(),
    supabase.from('invoices').select('*').eq('order_id', id).single(),
    supabase.from('shop_settings').select('*').eq('id', 1).single()
  ]);

  if (!order || !invoice || !settings) {
    notFound();
  }

  const order_items = order.order_items || [];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 15mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="max-w-3xl mx-auto p-8 bg-white text-gray-900 font-sans text-sm">
        
        <PrintButton label="🖨️ Print Invoice" />

        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-800">
          <div>
            {settings.logo_url && (
              <img src={settings.logo_url} height={64} className="mb-2 object-contain" alt="Logo" />
            )}
            <h2 className="text-xl font-bold">{settings.store_name}</h2>
            <p className="text-gray-600 whitespace-pre-line">{settings.store_address}</p>
            <p className="text-gray-600">{settings.store_city}, {settings.store_state} — {settings.store_pincode}</p>
            <p className="text-gray-600">GSTIN: {settings.gst_number}</p>
            <p className="text-gray-600">Ph: {settings.store_phone}</p>
            <p className="text-gray-600">Email: {settings.store_email}</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-wide text-gray-800">TAX INVOICE</h1>
            <p className="mt-2">Invoice #: <span className="font-mono font-bold">{invoice.invoice_number}</span></p>
            <p>Date: {formatInvoiceDate(invoice.issued_at)}</p>
            <p>Order #: <span className="font-mono">#{order.id.slice(0,8).toUpperCase()}</span></p>
            <p className="mt-1 text-green-700 font-semibold">✅ PAID</p>
          </div>
        </div>

        <div className="mb-6 bg-gray-50 rounded p-4">
          <h3 className="font-bold text-xs uppercase tracking-wide text-gray-500 mb-2">BILL TO</h3>
          <p className="font-bold text-base">{order.customer_name}</p>
          <p>Ph: {order.customer_phone}</p>
          <p>{order.shipping_address?.line1}</p>
          {order.shipping_address?.line2 && <p>{order.shipping_address.line2}</p>}
          <p>{order.shipping_address?.city}, {order.shipping_address?.state} — {order.shipping_address?.pincode}</p>
          <p>India</p>
        </div>

        <table className="w-full border-collapse mb-6 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left w-8">#</th>
              <th className="border border-gray-300 p-2 text-left">Description</th>
              <th className="border border-gray-300 p-2 text-center w-20">HSN</th>
              <th className="border border-gray-300 p-2 text-center w-12">Qty</th>
              <th className="border border-gray-300 p-2 text-right w-24">Unit Rate</th>
              <th className="border border-gray-300 p-2 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order_items.map((item: any, i: number) => (
              <tr key={item.id}>
                <td className="border border-gray-300 p-2">{i+1}</td>
                <td className="border border-gray-300 p-2">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-gray-500 text-xs">
                    Size: {item.size}
                    {item.color ? ` | Color: ${item.color}` : ''}
                  </p>
                </td>
                <td className="border border-gray-300 p-2 text-center">{settings.hsn_code}</td>
                <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 p-2 text-right">{formatIndianCurrency(item.unit_price)}</td>
                <td className="border border-gray-300 p-2 text-right font-medium">{formatIndianCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <table className="text-sm min-w-64">
            <tbody>
              <tr>
                <td className="py-1 pr-4 text-gray-600">Subtotal</td>
                <td className="py-1 text-right font-medium">{formatIndianCurrency(invoice.subtotal)}</td>
              </tr>
              {invoice.discount > 0 && (
                <tr className="text-green-700">
                  <td className="py-1 pr-4">Discount</td>
                  <td className="py-1 text-right">-{formatIndianCurrency(invoice.discount)}</td>
                </tr>
              )}
              <tr>
                <td className="py-1 pr-4 text-gray-600">Shipping</td>
                <td className="py-1 text-right">
                  {invoice.shipping === 0 ? 'FREE' : formatIndianCurrency(invoice.shipping)}
                </td>
              </tr>
              <tr className="border-t border-gray-200">
                {invoice.cgst > 0 ? (
                  <>
                    <tr>
                      <td className="py-1 pr-4 text-gray-600">CGST (6%)</td>
                      <td className="py-1 text-right">{formatIndianCurrency(invoice.cgst)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 text-gray-600">SGST (6%)</td>
                      <td className="py-1 text-right">{formatIndianCurrency(invoice.sgst)}</td>
                    </tr>
                  </>
                ) : invoice.igst > 0 ? (
                  <tr>
                    <td className="py-1 pr-4 text-gray-600">IGST (12%)</td>
                    <td className="py-1 text-right">{formatIndianCurrency(invoice.igst)}</td>
                  </tr>
                ) : (
                  <tr>
                    <td className="py-1 pr-4 text-gray-600">GST</td>
                    <td className="py-1 text-right text-gray-500">Nil (≤ ₹1,000)</td>
                  </tr>
                )}
              </tr>
              <tr className="border-t-2 border-gray-800">
                <td className="py-2 pr-4 font-bold text-base">Grand Total</td>
                <td className="py-2 text-right font-bold text-base text-[#c9a84c]">
                  {formatIndianCurrency(invoice.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm italic text-gray-600 mb-4">
          Amount in words: <strong>{rupeeToWords(invoice.total)}</strong>
        </p>

        <div className="bg-gray-50 rounded p-4 mb-6 text-sm">
          <h3 className="font-bold text-xs uppercase tracking-wide text-gray-500 mb-2">PAYMENT DETAILS</h3>
          <p>Method: Razorpay (Online)</p>
          <p>Transaction ID: <span className="font-mono">{order.razorpay_payment_id}</span></p>
          <p>Razorpay Order: <span className="font-mono">{order.razorpay_order_id}</span></p>
          <p className="text-green-700 font-semibold mt-1">Status: PAID ✅</p>
        </div>

        <div className="border-t border-gray-300 pt-4 text-xs text-gray-500 space-y-1">
          <p>{settings.invoice_footer_note}</p>
          <p>{settings.invoice_terms}</p>
        </div>

        <div className="flex justify-between mt-8 pt-4 text-xs text-gray-500">
          <div>
            <p>Customer Signature</p>
            <div className="w-32 h-10 border-b border-gray-400 mt-4"></div>
          </div>
          <div className="text-right">
            <p>For {settings.store_name}</p>
            <div className="w-32 h-10 border-b border-gray-400 mt-4"></div>
            <p className="mt-1">Authorized Signatory</p>
          </div>
        </div>

      </div>
    </>
  );
}
