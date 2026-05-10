import { createAdminSupabaseClient } from './supabase/admin';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/** Fetch a small set of keys from site_settings (key-value store) */
async function getSiteSettings(keys: string[]): Promise<Record<string, any>> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from('site_settings').select('key, value').in('key', keys);
  return (data ?? []).reduce((acc: Record<string, any>, row) => {
    const raw = row.value;
    acc[row.key] = raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw;
    return acc;
  }, {});
}

export async function sendEmail(payload: { to: string, subject: string, htmlContent: string, replyTo?: string }) {
  try {
    const settings = await getSiteSettings(['store_name', 'logo_url', 'store_email']);
    const senderName = settings.store_name || 'LabelWink';
    const senderEmail = settings.store_email || 'noreply@labelwink.co';

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: payload.to }],
        subject: payload.subject,
        htmlContent: payload.htmlContent,
        ...(payload.replyTo && { replyTo: { email: payload.replyTo } })
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brevo API Error:', errorText);
    }
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

async function getTemplate(key: string) {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from('email_templates').select('subject, is_active').eq('template_key', key).single();
  return data;
}

export async function sendOrderConfirmationEmail(order: any) {
  const settings = await getSiteSettings(['store_name', 'logo_url']);
  const storeName = settings.store_name || 'LabelWink';
  const logoUrl = settings.logo_url || '';

  const template = await getTemplate('order_confirmation');
  if (template && !template.is_active) {
    console.warn('Skipping order confirmation email because template is inactive');
    return;
  }

  const subject = template?.subject
    ? template.subject.replace('{{invoice_number}}', order.invoice_number).replace('{{store_name}}', storeName)
    : `Order Confirmed — ${order.invoice_number} | ${storeName}`;

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in';
  
  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">
        ${item.product_image ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">
        <p style="margin: 0; font-weight: bold;">${item.product_name}</p>
        ${item.size ? `<p style="margin: 0; font-size: 12px; color: #666;">Size: ${item.size}</p>` : ''}
        ${item.color ? `<p style="margin: 0; font-size: 12px; color: #666;">Color: ${item.color}</p>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">x${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${item.unit_price}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">₹${item.total_price}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 20px; text-align: center;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" style="max-height: 50px; margin-bottom: 10px;" />` : `<h1 style="color: #c9a84c; margin: 0;">${storeName}</h1>`}
        <h2 style="color: #c9a84c; margin: 0; text-transform: uppercase;">Order Confirmed</h2>
      </div>
      
      <!-- Content -->
      <div style="padding: 20px; background-color: #faf7f2;">
        <p>Hi ${order.customer_name},</p>
        <p>Thank you for your order! We've received it and are getting it ready for you.</p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #eaeaea;">
          <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${order.invoice_number}</p>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> #${String(order.order_id).substring(0, 8).toUpperCase()}</p>
          <p style="margin: 5px 0;"><strong>Payment:</strong> Razorpay ✅</p>
          <p style="margin: 5px 0;"><strong>TXN ID:</strong> ${order.razorpay_payment_id}</p>
        </div>

        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #ffffff;">
          ${itemsHtml}
        </table>

        <div style="text-align: right; background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #eaeaea;">
          <p style="margin: 5px 0;">Subtotal: ₹${order.subtotal}</p>
          ${order.discount_amount > 0 ? `<p style="margin: 5px 0; color: green;">Discount: -₹${order.discount_amount}</p>` : ''}
          <p style="margin: 5px 0;">Shipping: ${order.shipping_amount === 0 ? 'FREE' : `₹${order.shipping_amount}`}</p>
          ${order.tax_amount > 0 ? `<p style="margin: 5px 0;">Tax: ₹${order.tax_amount}</p>` : ''}
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #c9a84c;">Grand Total: ₹${order.total}</p>
        </div>

        <h3>Delivery Address</h3>
        <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #eaeaea;">
          <p style="margin: 0;">${order.shipping_address.line1}</p>
          ${order.shipping_address.line2 ? `<p style="margin: 0;">${order.shipping_address.line2}</p>` : ''}
          <p style="margin: 0;">${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${SITE_URL}/account/orders/${order.order_id}" style="background-color: #c9a84c; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Track Your Order</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #ffffff; color: #faf7f2; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: order.customer_email,
    subject,
    htmlContent
  });
}

export async function sendDispatchEmail(order: any) {
  const settings = await getSiteSettings(['store_name', 'logo_url']);
  const storeName = settings.store_name || 'LabelWink';
  const logoUrl = settings.logo_url || '';

  const template = await getTemplate('order_dispatched');
  if (template && !template.is_active) {
    console.warn('Skipping order dispatched email because template is inactive');
    return;
  }

  const subject = template?.subject
    ? template.subject.replace('{{invoice_number}}', order.invoice_number).replace('{{store_name}}', storeName)
    : `Your order is on the way! 🚚 — ${order.invoice_number}`;

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 20px; text-align: center;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
        <h2 style="color: #c9a84c; margin: 0; text-transform: uppercase;">YOUR ORDER IS ON ITS WAY 🚚</h2>
      </div>
      
      <!-- Content -->
      <div style="padding: 20px; background-color: #faf7f2;">
        <p>Hi ${order.customer_name},</p>
        <p>Great news! Your order has been dispatched and is now on its way to you.</p>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #c8e6c9;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #2e7d32;">AWB Tracking Number</p>
          <p style="margin: 0; font-size: 24px; font-weight: bold; font-family: monospace; color: #1b5e20;">${order.tracking_number}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Carrier:</strong> ${order.shipping_carrier}</p>
          ${order.estimated_delivery ? `<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Estimated Delivery:</strong> ${order.estimated_delivery}</p>` : ''}
        </div>

        ${order.tracking_url ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${order.tracking_url}" style="background-color: #c9a84c; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Track My Package</a>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 20px;">
          <a href="${SITE_URL}/account/orders/${order.order_id}" style="color: #ffffff; text-decoration: underline;">View Order Details</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #ffffff; color: #faf7f2; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: order.customer_email,
    subject,
    htmlContent
  });
}

export async function sendBackInStockEmail(alert: any, product_name: string, size: string, product_image: string, slug: string) {
  const settings = await getSiteSettings(['store_name', 'logo_url']);
  const storeName = settings.store_name || 'LabelWink';
  const logoUrl = settings.logo_url || '';

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in';
  
  const subject = `Good news! ${product_name} (${size}) is back in stock ✨`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 20px; text-align: center;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
        <h2 style="color: #c9a84c; margin: 0; text-transform: uppercase;">Back in Stock!</h2>
      </div>
      
      <!-- Content -->
      <div style="padding: 20px; background-color: #faf7f2; text-align: center;">
        <p>Hi there,</p>
        <p>You asked us to let you know when <strong>${product_name}</strong> in size <strong>${size}</strong> was back. Good news — it's here!</p>
        
        <div style="margin: 20px 0;">
          ${product_image ? `<img src="${product_image}" alt="${product_name}" style="max-width: 100%; max-height: 300px; border-radius: 8px; object-fit: cover;" />` : ''}
          <h3 style="margin: 10px 0 0 0;">${product_name}</h3>
          <p style="color: #666; margin: 5px 0;">Size: ${size}</p>
        </div>

        <p style="color: #e53e3e; font-weight: bold; margin: 20px 0;">Limited stock — order soon!</p>

        <a href="${SITE_URL}/products/${slug}?size=${size}" style="background-color: #c9a84c; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Shop Now</a>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #ffffff; color: #faf7f2; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: alert.email,
    subject,
    htmlContent
  });
}

export async function sendAbandonedCartEmail(data: {
  email: string,
  first_name?: string,
  cart_items: Array<{ product_name: string, size: string, quantity: number, unit_price: number, product_image?: string }>,
  cart_total: number,
  recovery_url: string,
  store_name: string,
  logo_url?: string
}) {
  try {
    const itemsHtml = data.cart_items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          ${item.product_image ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <p style="margin: 0; font-weight: bold;">${item.product_name}</p>
          <p style="margin: 0; font-size: 12px; color: #666;">Size: ${item.size}</p>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">x${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">₹${item.unit_price}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
        <div style="background-color: #ffffff; padding: 20px; text-align: center;">
          ${data.logo_url ? `<img src="${data.logo_url}" alt="${data.store_name}" style="max-height: 50px;" />` : `<h1 style="color: #c9a84c; margin: 0;">${data.store_name}</h1>`}
        </div>
        
        <div style="padding: 20px; background-color: #faf7f2; text-align: center;">
          <h2 style="color: #ffffff; margin-top: 0;">You left something behind...</h2>
          <p>Hi ${data.first_name || 'there'},</p>
          <p>Your cart is waiting — complete your purchase before items sell out.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff; text-align: left;">
            ${itemsHtml}
          </table>

          <div style="text-align: right; margin-bottom: 20px; font-size: 18px; font-weight: bold;">
            Total: ₹${data.cart_total}
          </div>

          <div style="margin: 30px 0;">
            <a href="${data.recovery_url}" style="background-color: #c9a84c; color: #ffffff; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; font-size: 16px;">Complete My Purchase</a>
          </div>

          <p style="color: #e53e3e; font-weight: bold;">⚡ Items in your cart are selling fast!</p>
        </div>
        
        <div style="background-color: #ffffff; color: #faf7f2; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0 0 10px 0;">Don't want to receive these emails? Unsubscribe in your account settings.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${data.store_name}. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: "You left something in your cart! 🛒",
      htmlContent
    });
  } catch (error) {
    console.error('Failed to send abandoned cart email:', error);
  }
}

export async function sendCampaignEmail(data: {
  to: string,
  subject: string,
  preview_text?: string,
  body_html: string,
  store_name: string,
  logo_url?: string,
  unsubscribe_url: string
}) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
      <!-- Preview Text (Hidden) -->
      ${data.preview_text ? `<div style="display: none; max-height: 0px; overflow: hidden;">${data.preview_text}</div>` : ''}
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 30px 20px; text-align: center;">
        ${data.logo_url ? `<img src="${data.logo_url}" alt="${data.store_name}" style="max-height: 50px;" />` : `<h1 style="color: #c9a84c; margin: 0;">${data.store_name}</h1>`}
      </div>
      
      <!-- Main Content -->
      <div style="padding: 40px 30px;">
        ${data.body_html}
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9f9f9; color: #666666; padding: 40px 20px; text-align: center; font-size: 12px; border-top: 1px solid #eeeeee;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #ffffff;">${data.store_name}</p>
        <p style="margin: 0 0 20px 0; line-height: 1.5;">You're receiving this because you subscribed to our newsletter.<br/>Want to change how you receive these emails?</p>
        <p style="margin: 0;">
          <a href="${data.unsubscribe_url}" style="color: #c9a84c; text-decoration: underline; font-weight: bold;">Unsubscribe from this list</a>
        </p>
        <p style="margin: 20px 0 0 0; color: #999999;">&copy; ${new Date().getFullYear()} ${data.store_name}. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: data.to,
    subject: data.subject,
    htmlContent
  });
}
