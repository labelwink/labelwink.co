-- Create pages_content table
CREATE TABLE IF NOT EXISTS pages_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL, -- 'home', 'about', 'contact', 'faq'
  title TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pages
INSERT INTO pages_content (slug, title, sections) VALUES
  ('about', 'About Us', '[
    {"type": "hero", "title": "Our Story", "content": "Celebrating simplicity and sustainability in every stitch.", "image": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"},
    {"type": "text_block", "title": "Simplicity & Sustainability", "content": "At LABEL WINK we celebrate simplicity and sustainability. Our women’s daily wear collection is made from natural, breathable fabrics and crafted with care to support a conscious lifestyle."}
  ]'),
  ('faq', 'FAQs', '[
    {"question": "How do I track my order?", "answer": "You will receive a tracking link via email once your order is shipped."},
    {"question": "What is your return policy?", "answer": "We accept returns within 7 days of delivery for unused items."}
  ]')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE pages_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Pages Content" ON pages_content FOR SELECT USING (true);
