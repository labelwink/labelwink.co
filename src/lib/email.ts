// src/lib/email.ts
import { templateOrderConfirmed } from '@/lib/email-templates';
export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderNumber,
  invoiceNumber,
  items,
  totalAmount,
  deliveryAddress,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  invoiceNumber: string;
  items: any[];
  totalAmount: number;
  deliveryAddress: any;
}) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;

  if (!brevoApiKey || !fromEmail) {
    console.warn('[Email] Brevo API Key or From Email missing. Skipping email.');
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'LabelWink',
          email: fromEmail,
        },
        to: [{ email: to, name: customerName }],
        subject: `Your LabelWink Order #${orderNumber} is Confirmed! 🎉`,
        htmlContent: templateOrderConfirmed({
          orderNumber,
          totalAmount,
          items,
          customerName
        }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Email] Brevo API Error:', errorText);
    } else {
      console.log('[Email] Order confirmation sent successfully to:', to);
    }
  } catch (error) {
    console.error('[Email] Unexpected error sending email:', error);
  }
}
