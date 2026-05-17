import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { ShippingLabelPDF } from './ShippingLabelPDF';
import { SupabaseClient } from '@supabase/supabase-js';

export async function generateOrderDocuments(
  supabase: SupabaseClient,
  order: any,
  legalSettings: any
) {
  try {
    const orderId = order.id;
    
    // 1. Generate Buffers
    const invoiceBuffer = await renderToBuffer(
      <InvoicePDF order={order} legalSettings={legalSettings} />
    );
    const labelBuffer = await renderToBuffer(
      <ShippingLabelPDF order={order} legalSettings={legalSettings} />
    );

    // 2. Upload to Supabase Storage
    const invoicePath = `invoices/${orderId}.pdf`;
    const labelPath = `labels/${orderId}.pdf`;

    const [invoiceUpload, labelUpload] = await Promise.all([
      supabase.storage.from('order-documents').upload(invoicePath, invoiceBuffer, {
        contentType: 'application/pdf',
        upsert: true
      }),
      supabase.storage.from('order-documents').upload(labelPath, labelBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })
    ]);

    if (invoiceUpload.error) throw invoiceUpload.error;
    if (labelUpload.error) throw labelUpload.error;

    // 3. Return the storage paths (not public URLs since bucket is private)
    return {
      invoice_pdf_url: invoicePath,
      label_pdf_url: labelPath,
      documents_generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating order documents:', error);
    throw error;
  }
}
