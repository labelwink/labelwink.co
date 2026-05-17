export const BRAND_COLORS = {
  primary: '#1B3A2D',   // Dark Green
  secondary: '#016a6e', // Teal
  accent: '#E8E2D9',    // Warm Sand/Gold
  background: '#FAF8F5', // Cream
  textDark: '#1A1A1A',
  textLight: '#5a7060',
  border: '#F0ECE6'
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co';

export function wrapEmailLayout(content: string, preheader: string = 'Update from LabelWink') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LabelWink</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BRAND_COLORS.background}; font-family: 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background-color: ${BRAND_COLORS.primary}; padding: 32px 20px; text-align: center; }
    .header img { height: 48px; width: auto; }
    .content { padding: 40px 32px; color: ${BRAND_COLORS.textDark}; }
    .footer { background-color: ${BRAND_COLORS.background}; padding: 32px; text-align: center; border-top: 1px solid ${BRAND_COLORS.border}; }
    .btn { display: inline-block; background-color: ${BRAND_COLORS.primary}; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.5px; margin-top: 24px; text-align: center; }
    p { line-height: 1.6; color: ${BRAND_COLORS.textLight}; font-size: 15px; margin-top: 0; }
    h1, h2 { color: ${BRAND_COLORS.primary}; margin-top: 0; }
    .box { background: ${BRAND_COLORS.background}; border: 1px solid ${BRAND_COLORS.border}; border-radius: 8px; padding: 24px; margin: 24px 0; }
    @media (max-width: 600px) { .content { padding: 24px 20px; } }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <div style="padding: 40px 10px;">
    <div class="container">
      <div class="header">
        <img src="${SITE_URL}/logo.png" alt="LabelWink" />
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p style="color: ${BRAND_COLORS.primary}; font-weight: 600; margin-bottom: 8px;">LabelWink</p>
        <p style="font-size: 12px; margin-bottom: 16px;">Coimbatore, Tamil Nadu, India</p>
        <a href="${SITE_URL}" style="color: ${BRAND_COLORS.secondary}; text-decoration: none; font-size: 13px; font-weight: 600;">Visit Website</a>
        <span style="color: ${BRAND_COLORS.border}; margin: 0 8px;">|</span>
        <a href="${SITE_URL}/contact" style="color: ${BRAND_COLORS.secondary}; text-decoration: none; font-size: 13px; font-weight: 600;">Contact Support</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function templateWelcomeEmail(name: string) {
  const content = `
    <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to LabelWink! 🎉</h1>
    <p>Hi ${name || 'there'},</p>
    <p>We are absolutely thrilled to have you here! At LabelWink, we craft premium, elegant, and timeless pieces designed to make you stand out.</p>
    <p>As a warm welcome, you can use the coupon code <strong>WELCOME10</strong> on your first order to get 10% off!</p>
    <div style="text-align: center;">
      <a href="${SITE_URL}/products" class="btn">Explore the Collection</a>
    </div>
  `;
  return wrapEmailLayout(content, 'Welcome to LabelWink! Your journey starts here.');
}

export function templateOrderConfirmed(data: any) {
  const itemsHtml = (data.items || []).map((item: any) => `
    <div style="border-bottom: 1px solid ${BRAND_COLORS.border}; padding: 12px 0; display: table; width: 100%;">
      <div style="display: table-cell; vertical-align: middle;">
        <p style="margin: 0; font-weight: 600; color: ${BRAND_COLORS.primary};">${item.name || item.product_name}</p>
        <p style="margin: 4px 0 0; font-size: 13px;">Size: ${item.size || 'Free Size'} × ${item.quantity}</p>
      </div>
      <div style="display: table-cell; vertical-align: middle; text-align: right; font-weight: 600; color: ${BRAND_COLORS.primary};">
        ₹${item.price || item.unit_price}
      </div>
    </div>
  `).join('');

  const content = `
    <h1 style="font-size: 24px;">Order Confirmed! ✨</h1>
    <p>Hi ${data.customerName || 'there'},</p>
    <p>Your payment was successful and your order <strong>#${data.orderNumber}</strong> has been confirmed. We're getting it ready for dispatch!</p>
    
    <div class="box">
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="padding-bottom: 8px;"><strong>Order ID:</strong></td><td style="padding-bottom: 8px; text-align: right;">${data.orderNumber}</td></tr>
        <tr><td style="padding-bottom: 8px;"><strong>Total Paid:</strong></td><td style="padding-bottom: 8px; text-align: right; color: ${BRAND_COLORS.primary}; font-weight: bold;">₹${data.totalAmount}</td></tr>
      </table>
    </div>

    <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 16px;">Order Summary</h2>
    ${itemsHtml}

    <div style="margin-top: 32px; text-align: center;">
      <a href="${SITE_URL}/account/orders/${data.orderId || data.orderNumber}" class="btn">View Order Status</a>
    </div>
  `;
  return wrapEmailLayout(content, `Your LabelWink order #${data.orderNumber} is confirmed.`);
}

export function templateOrderShipped(data: any) {
  const content = `
    <h1 style="font-size: 24px;">Your Order is on the way! 🚚</h1>
    <p>Hi ${data.customerName || 'there'},</p>
    <p>Great news! Your order <strong>#${data.orderNumber}</strong> has been shipped and is on its way to you.</p>
    
    <div class="box" style="text-align: center;">
      <p style="margin-bottom: 8px; color: ${BRAND_COLORS.primary}; font-weight: 600;">Tracking Details / AWB</p>
      <p style="font-size: 20px; font-weight: bold; margin: 0; color: ${BRAND_COLORS.secondary};">${data.awb || 'Check Dashboard'}</p>
      ${data.courier ? `<p style="font-size: 13px; margin-top: 8px;">Courier: ${data.courier}</p>` : ''}
    </div>

    <div style="text-align: center;">
      <a href="${SITE_URL}/account/orders/${data.orderId || data.orderNumber}" class="btn">Track Shipment</a>
    </div>
  `;
  return wrapEmailLayout(content, `LabelWink Order #${data.orderNumber} has been shipped!`);
}

export function templateOrderDelivered(data: any) {
  const content = `
    <h1 style="font-size: 24px;">Order Delivered! 🎁</h1>
    <p>Hi ${data.customerName || 'there'},</p>
    <p>Your order <strong>#${data.orderNumber}</strong> has been marked as delivered. We hope you love your new pieces from LabelWink!</p>
    
    <div class="box" style="background-color: #F0F7F4; border-color: #D1E7DD; text-align: center;">
      <p style="margin: 0; color: #1B3A2D; font-weight: 600;">We'd love your feedback!</p>
      <p style="font-size: 13px; margin-top: 8px;">If you love the fit, tag us on Instagram @labelwink.co</p>
    </div>

    <div style="text-align: center;">
      <a href="${SITE_URL}/products" class="btn">Shop New Arrivals</a>
    </div>
  `;
  return wrapEmailLayout(content, `Your LabelWink order has arrived.`);
}

export function templateReturnAccepted(data: any) {
  const content = `
    <h1 style="font-size: 24px;">Return Request Accepted ✅</h1>
    <p>Hi ${data.customerName || 'there'},</p>
    <p>Your return request for order <strong>#${data.orderNumber}</strong> has been successfully approved.</p>
    
    <div class="box">
      <p style="margin: 0;">Our delivery partner will pick up the item within the next 24-48 hours. Please keep the product packed in its original packaging with tags intact.</p>
    </div>
    
    <p>Once the item passes our quality check, your refund will be initiated to your original payment method or as Wink Points.</p>

    <div style="text-align: center;">
      <a href="${SITE_URL}/account/returns" class="btn">View Return Status</a>
    </div>
  `;
  return wrapEmailLayout(content, `Update on your return request for LabelWink order #${data.orderNumber}`);
}

export function templateOffersEmail(data: any) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #FEE2E2; color: #991B1B; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Exclusive Offer</span>
    </div>
    <h1 style="font-size: 28px; text-align: center;">${data.offerTitle || 'Special Offer Inside!'}</h1>
    <p style="text-align: center; font-size: 16px;">${data.offerDescription || 'We are running a special sale this weekend. Grab your favorite pieces before they run out.'}</p>
    
    <div class="box" style="text-align: center; background: #1B3A2D; border-color: #1B3A2D;">
      <p style="color: #E8E2D9; margin-bottom: 8px;">Use Code at Checkout</p>
      <p style="font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: 2px; margin: 0;">${data.couponCode || 'SALE20'}</p>
    </div>

    <div style="text-align: center;">
      <a href="${SITE_URL}/products" class="btn">Shop The Sale Now</a>
    </div>
  `;
  return wrapEmailLayout(content, `${data.offerTitle || 'Special Offer Inside!'} - LabelWink`);
}
