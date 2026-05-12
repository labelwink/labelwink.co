// src/lib/email.ts

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
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: #1B3A2D; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 2px;">LabelWink</h1>
              <p style="color: #E8E2D9; margin: 8px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Wear Wink</p>
            </div>
            
            <div style="padding: 32px 24px;">
              <h2 style="color: #1A1A1A; font-size: 20px;">Order Confirmed! ✅</h2>
              <p style="color: #5a7060; font-size: 15px; line-height: 1.5;">
                Hi ${customerName}, your order has been placed successfully. Thank you for choosing LabelWink!
              </p>
              
              <div style="background: #FAF8F5; border: 1px solid #E8E2D9; 
                          border-radius: 12px; padding: 24px; margin: 24px 0;">
                <p style="margin: 0 0 12px; font-size: 14px;"><strong style="color: #1B3A2D;">Order Number:</strong> ${orderNumber}</p>
                <p style="margin: 0 0 12px; font-size: 14px;"><strong style="color: #1B3A2D;">Invoice:</strong> ${invoiceNumber}</p>
                <p style="margin: 0; font-size: 14px;"><strong style="color: #1B3A2D;">Amount Paid:</strong> ₹${totalAmount}</p>
              </div>
              
              <h3 style="color: #1A1A1A; font-size: 16px; margin-bottom: 16px; border-bottom: 1px solid #E8E2D9; padding-bottom: 8px;">Items Ordered:</h3>
              ${items.map(item => `
                <div style="border-bottom: 1px solid #F0ECE6; padding: 12px 0;">
                  <p style="margin: 0; font-weight: 600; font-size: 14px; color: #1B3A2D;">${item.name || item.product_name}</p>
                  <p style="margin: 4px 0; color: #5a7060; font-size: 13px;">
                    Size: ${item.size || 'Free Size'} × ${item.quantity}
                  </p>
                  <p style="margin: 0; font-weight: 600; font-size: 14px;">₹${item.price || item.unit_price}</p>
                </div>
              `).join('')}
              
              <div style="margin-top: 32px; padding: 20px; 
                          background: #F0F7F4; border-radius: 12px; border: 1px solid #D1E7DD;">
                <p style="margin: 0; color: #1B3A2D; font-size: 14px; line-height: 1.6;">
                  🚚 <strong>Delivery Timeline:</strong> Your order will be shipped within 2-3 business days.
                  You'll receive a tracking update via SMS and email once dispatched.
                </p>
              </div>

              <div style="margin-top: 32px; font-size: 14px; line-height: 1.6;">
                <h3 style="color: #1A1A1A; font-size: 16px; margin-bottom: 8px;">Delivery Address:</h3>
                <p style="margin: 0; color: #5a7060;">
                  ${deliveryAddress.name || deliveryAddress.first_name + ' ' + deliveryAddress.last_name}<br>
                  ${deliveryAddress.line1}<br>
                  ${deliveryAddress.line2 ? deliveryAddress.line2 + '<br>' : ''}
                  ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}<br>
                  ${deliveryAddress.phone || ''}
                </p>
              </div>
            </div>
            
            <div style="background: #FAF8F5; padding: 24px; text-align: center;
                        border-top: 1px solid #E8E2D9;">
              <p style="color: #1B3A2D; font-weight: 600; font-size: 14px; margin: 0 0 8px;">LabelWink</p>
              <p style="color: #5a7060; font-size: 12px; margin: 0;">
                Coimbatore, Tamil Nadu, India
              </p>
              <div style="margin-top: 16px;">
                <a href="https://labelwink.co" style="color: #1B3A2D; text-decoration: none; font-size: 12px; font-weight: 600;">Visit Website</a>
              </div>
            </div>
          </div>
        `,
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
