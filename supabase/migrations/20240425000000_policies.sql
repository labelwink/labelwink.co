-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT UNIQUE NOT NULL, -- 'privacy_policy', 'refund_policy', 'shipping_policy', 'terms_conditions'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default policies
INSERT INTO policies (type, title, content) VALUES
  ('shipping_policy', 'Shipping Policy', 'Orders are processed within 2–4 business days...'),
  ('refund_policy', 'Refund & Return Policy', 'We accept returns and exchanges only if the product is unused...'),
  ('privacy_policy', 'Privacy Policy', 'Your privacy is important to us...'),
  ('terms_conditions', 'Terms & Conditions', 'By using our website, you agree to these terms...')
ON CONFLICT (type) DO NOTHING;

-- Enable RLS
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Policies" ON policies FOR SELECT USING (true);
