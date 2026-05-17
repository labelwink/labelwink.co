import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { formatInvoiceDate } from '@/lib/invoice-helpers';
import PrintButton from '@/components/admin/PrintButton';

export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [
    { data: order },
    { data: settings }
  ] = await Promise.all([
    supabase.from('orders').select('*, order_items(*)').eq('id', id).single(),
    supabase.from('shop_settings').select('*').eq('id', 1).single()
  ]);

  if (!order || !settings) {
    notFound();
  }

  const order_items = order.order_items || [];
  const addr = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address ?? {};

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 5mm; size: 100mm 150mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="max-w-xs mx-auto border-2 border-black font-sans text-sm p-0 bg-white text-black">
        
        <div className="no-print p-4">
          <PrintButton label="🏷️ Print Label" />
        </div>

        <div className="border-b-2 border-black p-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">FROM:</p>
          <p className="font-bold">{settings.store_name}</p>
          <p className="text-xs">{settings.store_address}</p>
          <p className="text-xs">{settings.store_city}, {settings.store_state} {settings.store_pincode}</p>
          <p className="text-xs">Ph: {settings.store_phone}</p>
        </div>

        <div className="border-b-2 border-black p-3 bg-gray-50">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">TO:</p>
          <p className="text-xl font-bold leading-tight">{order.customer_name}</p>
          <p className="text-base font-semibold mt-1">Ph: {order.customer_phone}</p>
          {addr?.alt_phone && (
            <p className="text-sm">Alt: {addr.alt_phone}</p>
          )}
          <p className="mt-2">{addr?.line1}</p>
          {addr?.line2 && <p>{addr.line2}</p>}
          <p>{addr?.city}, {addr?.state}</p>
          <p className="text-2xl font-black mt-1">PIN: {addr?.pincode}</p>
        </div>

        <div className="border-b border-black p-3">
          <div className="flex justify-between text-xs">
            <span>Order: <strong className="font-mono">#{order.id.slice(0,8).toUpperCase()}</strong></span>
            <span>{formatInvoiceDate(order.created_at)}</span>
          </div>
          <p className="text-xs mt-1">Ref: <span className="font-mono">{order.order_number}</span></p>
          {order.tracking_number && (
            <p className="text-xs mt-1">AWB: <strong className="font-mono">{order.tracking_number}</strong></p>
          )}
          {order.shipping_carrier && (
            <p className="text-xs">Carrier: {order.shipping_carrier}</p>
          )}
        </div>

        <div className="border-b border-black p-3">
          <p className="text-xs font-bold uppercase mb-1">Items:</p>
          {order_items.map((item: any) => {
            const itemSize = item.variant_size ?? item.size ?? '—';
            const itemColor = item.variant_color ?? item.color;

            return (
              <p key={item.id} className="text-xs">
                {item.product_name} ({itemSize}
                {itemColor ? `, ${itemColor}` : ''}) × {item.quantity}
              </p>
            )
          })}
        </div>

        {settings.label_warning_text && (
          <div className="p-3 text-center">
            <p className="text-xs font-bold border border-gray-400 rounded p-2">
              ⚠️ {settings.label_warning_text}
            </p>
          </div>
        )}

      </div>
    </>
  );
}
