import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/requireAdmin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const supabase = createAdminClient();

  try {
    const body = await req.json();
    const { customer_name, shipping_address, discount, admin_note } = body;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updates: any = {};
    const before: any = {};
    const after: any = {};

    if (customer_name !== undefined) {
      const newData = { ...invoice.data, customer_name };
      updates.data = newData;
      before.customer_name = invoice.data?.customer_name;
      after.customer_name = customer_name;
    }

    if (shipping_address !== undefined) {
      updates.data = { ...updates.data, shipping_address };
      before.shipping_address = invoice.data?.shipping_address;
      after.shipping_address = shipping_address;
    }

    if (discount !== undefined) {
      const newDiscount = Number(discount);
      updates.discount = newDiscount;
      const subtotal = Number(invoice.subtotal || 0);
      const shipping = Number(invoice.shipping || 0);
      const cgst = Number(invoice.cgst || 0);
      const sgst = Number(invoice.sgst || 0);
      const igst = Number(invoice.igst || 0);
      
      updates.total = subtotal - newDiscount + shipping + cgst + sgst + igst;
      
      before.discount = invoice.discount;
      before.total = invoice.total;
      after.discount = newDiscount;
      after.total = updates.total;
    }

    if (admin_note !== undefined) {
      updates.data = { ...updates.data, admin_note };
      before.admin_note = invoice.data?.admin_note;
      after.admin_note = admin_note;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updates)
      .eq('order_id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }

    await supabase.from('invoice_edits').insert({
      invoice_id: invoice.id,
      changes: { before, after },
      changed_by: 'admin'
    });

    return NextResponse.json(updatedInvoice);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
