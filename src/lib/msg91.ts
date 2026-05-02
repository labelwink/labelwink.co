const MSG91_API_BASE = 'https://control.msg91.com/api/v5';

export function normalizePhone(phone: string): string {
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Strip leading zeros
  digits = digits.replace(/^0+/, '');
  
  // If exactly 10 digits, prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  
  return digits;
}

export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    console.warn('MSG91_AUTH_KEY is not set. OTP not sent.');
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  const normalizedPhone = normalizePhone(phone);

  try {
    const response = await fetch(`${MSG91_API_BASE}/otp`, {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile: normalizedPhone,
        otp_length: 6,
        otp_expiry: 10
      })
    });

    const data = await response.json();
    
    if (data.type === 'success') {
      return { success: true };
    } else {
      return { success: false, error: data.message || 'Failed to send OTP' };
    }
  } catch (error: any) {
    console.error('MSG91 sendOTP error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function verifyOTP(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  const normalizedPhone = normalizePhone(phone);

  try {
    const response = await fetch(`${MSG91_API_BASE}/otp/verify?mobile=${normalizedPhone}&otp=${otp}`, {
      method: 'GET',
      headers: {
        'authkey': authKey
      }
    });

    const data = await response.json();
    
    if (data.type === 'success' || data.message === 'OTP verified success') {
      return { success: true };
    } else {
      return { success: false, error: data.message || 'Invalid OTP' };
    }
  } catch (error: any) {
    console.error('MSG91 verifyOTP error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function resendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  const normalizedPhone = normalizePhone(phone);

  try {
    const response = await fetch(`${MSG91_API_BASE}/otp/retry?mobile=${normalizedPhone}&retrytype=text`, {
      method: 'GET',
      headers: {
        'authkey': authKey
      }
    });

    const data = await response.json();
    
    if (data.type === 'success') {
      return { success: true };
    } else {
      return { success: false, error: data.message || 'Failed to resend OTP' };
    }
  } catch (error: any) {
    console.error('MSG91 resendOTP error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function sendSMS(phone: string, templateVars: Record<string, string>): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const flowId = process.env.MSG91_SMS_FLOW_ID;
  
  if (!authKey || !flowId) {
    console.warn('MSG91 SMS env vars missing. Message not sent.');
    return;
  }

  const normalizedPhone = normalizePhone(phone);

  try {
    const response = await fetch(`${MSG91_API_BASE}/flow`, {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: flowId,
        recipients: [
          {
            mobiles: normalizedPhone,
            ...templateVars
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('MSG91 Flow API error:', text);
    }
  } catch (error) {
    console.error('MSG91 sendSMS error:', error);
  }
}
