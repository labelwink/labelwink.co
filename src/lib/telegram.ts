export async function sendTelegramMessage(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram env vars missing. Message not sent.');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Telegram API Error:', errorText);
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

export async function sendNewOrderAlert(order: any) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in';
  
  let itemsText = '';
  if (order.items && order.items.length > 0) {
    itemsText = order.items.map((item: any) => 
      `  • ${item.product_name} (${item.size || 'N/A'}) × ${item.quantity} — ₹${item.total_price}`
    ).join('\n');
  }

  const message = `🛍️ <b>New Order — LabelWink</b>

📄 <b>Invoice:</b> ${order.invoice_number}
🆔 <b>Order:</b> #${String(order.order_id).substring(0, 8).toUpperCase()}
👤 <b>Customer:</b> ${order.customer_name}
📱 <b>Phone:</b> ${order.customer_phone}

📦 <b>Items:</b>
${itemsText}

💰 <b>Total:</b> ₹${order.total}
✅ <b>Payment:</b> Razorpay
🔑 <b>TXN:</b> <code>${order.razorpay_payment_id}</code>
📍 <b>Deliver to:</b> ${order.shipping_address.city}, ${order.shipping_address.state} — ${order.shipping_address.pincode}

👉 <a href="${SITE_URL}/admin/orders/${order.order_id}">View Order</a>`;

  await sendTelegramMessage(message);
}
