const { createClient } = require('@supabase/supabase-js');
const url = 'https://cjnuohqnaiggbvmbsqdx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbnVvaHFuYWlnZ2J2bWJzcWR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgzMjk0MCwiZXhwIjoyMDkyNDA4OTQwfQ.EzBgx_WaX8uaKtXVx1TtSGjiLSrrlCbuqD7_DOmRTNk';
const supabase = createClient(url, key);

async function run() {
  const res = await supabase.from('order_items').select(`
    id, quantity,
    price_at_purchase:unit_price,
    price:unit_price,
    variant_size:size,
    size,
    variant_color:color,
    color,
    product_name,
    product_id,
    product_image:image_url,
    image_url,
    products:product_id(name, id, slug)
  `).eq('order_id', 'be422164-1b82-4a4f-aa6a-fb010232a681');
  console.log(JSON.stringify(res, null, 2));
}

run();
