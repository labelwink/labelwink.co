# Label Wink — Full-Stack E-Commerce Development Plan
## Based on Competitor Audit: Lilium by Shrivha | Pleated Up | Zing Clothing

---

## Executive Summary

Label Wink is an Indian D2C women's fashion brand targeting a market maturity score of **8.5/10** at launch — significantly above the competition average of 4.8–5.5/10. The competitor audit of three rival stores (Lilium by Shrivha, Pleated Up, and Zing Clothing) reveals a uniform set of 10 critical gaps shared across all three stores. Filling every one of these gaps at launch is Label Wink's core competitive strategy.

The development plan is organized into three phases:
- **Phase 1 — MVP Launch:** Core storefront + admin panel (~10–12 weeks)
- **Phase 2 — Growth Features:** Loyalty, blog, UGC, automations (~6–8 weeks post-launch)
- **Phase 3 — Scaling:** AI personalization, analytics, advanced marketing (~ongoing)

---

## Positioning Target

| Dimension | Competitors (Avg.) | Label Wink Target |
|---|---|---|
| UI Design | 6.2/10 | 9/10 |
| UX Design | 5.0/10 | 9/10 |
| Product Discovery | 4.3/10 | 9/10 |
| PDP Quality | 4.7/10 | 9/10 |
| Conversion Optimization | 4.2/10 | 9/10 |
| Trust & Compliance | 5.2/10 | 9/10 |
| SEO Readiness | 5.3/10 | 9.5/10 |
| Feature Completeness | 4.2/10 | 9/10 |
| Admin Capability | 5.0/10 | 9/10 |
| Mobile Experience | 6.8/10 | 9.5/10 |
| **Overall Maturity** | **5.1/10** | **8.5/10** |

---

## Tech Stack Recommendation

### Storefront
| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/SSG for SEO, fast page loads, Indian mobile-first |
| Styling | Tailwind CSS v4 | Rapid UI iteration, responsive by default |
| State Management | Zustand | Lightweight cart, wishlist, UI state |
| Auth | Supabase Auth | OTP (SMS), Google OAuth, Email — Indian-first |
| Database | Supabase (PostgreSQL) | Managed DB, real-time subscriptions, RLS |
| File Storage | Supabase Storage | Product images, banner assets |
| Search | Algolia or Typesense | Instant/predictive search with image previews |
| Payments | Razorpay | UPI, cards, wallets, COD support — Indian gateway |
| Shipping | Shiprocket API | Multi-courier tracking, pincode checker |
| Email/CRM | Klaviyo | Abandoned cart, welcome, post-purchase flows |
| WhatsApp | Interakt or AiSensy | Automated cart recovery, order updates |
| Analytics | PostHog + GA4 | Event-level funnel analysis, conversion tracking |
| Deployment | Vercel | Edge network, fast CDN for India |

### Admin Panel
| Layer | Technology |
|---|---|
| Framework | Next.js (same codebase, /admin route group) |
| UI Components | shadcn/ui + Radix |
| Rich Text Editor | Tiptap or Quill (for blog, product descriptions) |
| Charts/Analytics | Recharts or Chart.js |
| File Upload | Supabase Storage + drag-and-drop uploader |
| Tables | TanStack Table v8 |

---

## Database Schema (Core Tables)

```sql
-- Products
products (id, name, slug, description, fabric, care_instructions, category_id, is_active, created_at)
product_variants (id, product_id, size, color, sku, price, mrp, stock_qty, images[])
product_images (id, product_id, variant_id, url, alt, sort_order)

-- Categories
categories (id, name, slug, parent_id, image_url, seo_title, seo_description, is_active)

-- Orders
orders (id, user_id, status, payment_method, payment_status, subtotal, discount, shipping_fee, total, shipping_address, tracking_id, courier, created_at)
order_items (id, order_id, variant_id, quantity, price_at_purchase, mrp_at_purchase)

-- Users & Accounts
users (id, name, phone, email, otp_verified, wink_points, created_at)
addresses (id, user_id, name, line1, line2, city, state, pincode, phone, is_default)
wishlists (id, user_id, variant_id, created_at)

-- Reviews
reviews (id, user_id, product_id, order_id, rating, title, body, images[], status, created_at)

-- Discounts
coupons (id, code, type[%|fixed|free_ship], value, min_order, max_uses, used_count, valid_from, valid_to, is_active)

-- Loyalty
wink_points_log (id, user_id, order_id, points_earned, points_spent, balance_after, action, created_at)

-- CMS
banners (id, title, image_url, cta_text, cta_link, position, is_active, sort_order)
announcements (id, text, link, is_active, created_at)
homepage_sections (id, section_type, title, config_json, sort_order, is_active)
```

---

## Phase 1 — MVP Launch (Weeks 1–12)

### Week 1–2: Project Setup & Design System

**Developer Tasks:**
- Initialize Next.js 14 monorepo with `/app` (storefront) and `/admin` route groups
- Configure Supabase project: DB, Auth (OTP + Google), Storage buckets
- Set up Tailwind v4 with custom design tokens (Label Wink brand palette — soft editorial tones: cream, blush, sage, charcoal)
- Configure ESLint, Prettier, Husky pre-commit hooks
- Set up Vercel project with environment variables
- Configure domain, SSL, DNS

**Design Tasks:**
- Define brand design system: color tokens, typography (Cormorant Garamond display + Satoshi body), spacing scale
- Design component library: buttons, cards, inputs, badges, modals — in Figma
- Define responsive grid: 4-col desktop, 2-col mobile for PLPs

**Deliverable:** Deployable skeleton with design tokens running on Vercel preview URL

---

### Week 3–4: Storefront — Core Pages

#### Homepage
- Sticky announcement bar (rotating offers)
- Sticky navigation with mega menu (with category images)
- Hero banner (CMS-managed, full-bleed editorial)
- Trust strip: Free Shipping / Easy Returns / Handcrafted / Secure Pay
- Collection highlight tiles (4 curated, CMS-managed)
- New Arrivals product grid (auto-tagged by `created_at`)
- Instagram/UGC feed section (static initially, shoppable in Phase 2)
- Newsletter signup with incentive ("₹150 off your first order")
- Footer: brand story, quick links, help, social, payment icons, newsletter

#### Collection/PLP Page
- Full-width filter sidebar (Size, Color, Price range, Fabric, Occasion, Sort)
- 4-column desktop / 2-column mobile product grid
- Product cards with: hover image swap, MRP + sale price + discount %, color swatches, wishlist heart, New/Sale/Trending/Low Stock badges
- Quick-add to cart on hover
- Breadcrumbs + product count ("Showing 24 of 86")
- Infinite scroll with load-more trigger
- Empty state: no-results with suggestions

#### Search
- Instant/predictive search drawer (Algolia or Typesense)
- Results with image thumbnails + price + category
- Recent searches (session-based)
- Trending searches (admin-managed)

**Deliverable:** Working PLP + Search functional on staging

---

### Week 5–6: Product Detail Page (PDP)

All elements confirmed missing across all 3 competitors — Label Wink ships ALL of them at launch:

- 5–8 image gallery with zoom + lightbox + video support (placeholder, expand in Phase 2)
- Color + size variant selector (swatches on PLP, pills on PDP)
- **Size guide popup** (per-product measurement chart with model wearing info)
- MRP + sale price + discount % (all three shown always)
- **"Only X left in stock"** scarcity text (real-time from inventory)
- **COD badge** ("Cash on Delivery Available")
- **Pincode delivery estimator** (Shiprocket API → "Delivered by Mon, 28 Apr")
- **Trust badges**: Free Returns / Secure Checkout / Handcrafted in India
- Return/exchange policy in collapsible accordion
- Customer reviews section with star ratings (0 reviews → "Be the first to review" CTA)
- Related products: "You May Also Like" (category-matched)
- **"Complete the Look" cross-sell section** (admin-curated product sets)
- Recently viewed products (session-based)
- **Sticky Add-to-Cart bar** (appears on scroll down)
- WhatsApp share button
- Breadcrumbs
- Wishlist button (saved to account)

**Deliverable:** Full PDP functional with all trust and conversion elements

---

### Week 7–8: Cart, Checkout & Account

#### Cart Drawer
- Slide-in cart drawer (no page navigation lost)
- **Free shipping progress bar** ("Add ₹X more for free shipping!")
- Cart item: image + variant + qty stepper + remove
- **Coupon code field** with auto-apply and error states
- COD badge confirmation
- Cross-sell: "You Might Also Like" (2 products, swappable)
- Subtotal + discount + shipping + total breakdown
- Proceed to Checkout CTA

#### Checkout
- OTP-based guest + account checkout
- Address form (with pincode auto-fill for city/state)
- Delivery estimate on checkout
- Payment: Razorpay (Cards, UPI, Netbanking, Wallets) + COD
- GST calculation (18% on apparel or per HSN code)
- Order confirmation page + email trigger

#### Account Portal
- Login: OTP (phone) + Google OAuth + Email/password
- Dashboard: Recent orders + Wink Points balance + Wishlist preview
- Orders: Full history with status, tracking link, invoice download
- Addresses: Add/edit/delete, set default
- Wishlist: Saved items with quick-add-to-cart
- Profile: Edit name, phone, email

**Deliverable:** End-to-end checkout functional on staging. Razorpay test mode confirmed.

---

### Week 9–10: Admin Panel

The admin panel is built as a protected `/admin` route group in the same Next.js codebase, with Supabase RLS ensuring only `role = 'admin'` users can access API routes.

#### Dashboard
- Revenue today / this week / this month (with sparklines)
- Orders pending / processing / shipped / delivered
- Top 5 selling products
- Conversion rate (sessions → orders)
- Low stock alerts (configurable threshold)
- Recent orders table

#### Products Module
- Product list: searchable, filterable, sortable table (TanStack Table)
- Add/Edit product form:
  - Basic info: name, slug (auto-generated), description (Tiptap rich text), fabric, care
  - Category assignment (multi-level)
  - Variant management: size × color matrix with individual SKU, price, MRP, stock qty
  - Image uploader: drag-and-drop, reorder, set primary (Supabase Storage)
  - SEO fields: meta title, meta description, OG image
  - Tags: New, Trending, Featured, On Sale (auto-apply discount badge)
  - Size guide: per-product measurement table
  - Related products + "Complete the Look" linking
- Bulk actions: activate/deactivate, bulk price update, bulk stock update
- CSV import/export

#### Orders Module
- Orders list: date, customer, total, payment method, status (filterable)
- Order detail: items, address, payment, shipping, timeline
- Status update: Pending → Processing → Shipped (enter tracking ID) → Delivered
- Shiprocket auto-sync (tracking pulled automatically)
- Initiate return/exchange from order
- Download GST invoice (PDF generation)
- COD orders: mark collected/failed

#### Customers Module
- Customer list with: name, phone, orders count, total spend, Wink Points
- Customer profile: order history, addresses, review history, points log
- Segment filter: VIP (>₹5000 spent), New (1 order), Inactive (no order in 90 days)

#### Discounts Module
- Coupon creation: code, type (% / fixed / free shipping), value, min order, max uses, date range
- Auto-discount rules: "All products in SALE collection → 20% off"
- Bulk coupon generation (e.g., 100 unique influencer codes)

#### Banners & CMS
- Homepage section manager: drag-to-reorder, activate/deactivate sections
- Banner uploader: image, CTA text, CTA link, position, start/end dates
- Announcement bar manager: rotating text + link
- Trending searches: manually set top search terms

#### Reviews Module
- Review queue: Pending / Approved / Flagged
- Approve, reply, flag, delete reviews
- Review summary by product: avg rating, total count

#### Analytics
- Revenue chart (daily/weekly/monthly)
- Top products by revenue and by units sold
- Collection performance
- Coupon redemption report
- Customer acquisition source (UTM-based)

**Deliverable:** Fully functional admin panel deployed to `/admin` on production (password-protected)

---

### Week 11–12: Trust, SEO & Pre-Launch QA

#### Trust & Compliance
- Contact page: form + WhatsApp button + email + response time
- **WhatsApp floating button** (bottom-right, all pages)
- All policy pages: Return Policy, Exchange Policy, Shipping Policy, Privacy Policy, Terms of Service
- Return/Exchange policy: clear "X days" timeframe, not boilerplate
- Physical address + GSTIN on About or Contact page
- Footer: GSTIN, CIN (if applicable), payment icons, social links

#### SEO Implementation
- Dynamic `<title>` and `<meta description>` per page (CMS-driven)
- JSON-LD structured data: Product, BreadcrumbList, Organization, FAQPage
- `sitemap.xml` auto-generated (Next.js sitemap package)
- `robots.txt` configured
- Canonical tags on all pages
- Image alt-text auto-generated from product name + variant
- Clean URL structure: `/collections/[slug]`, `/products/[slug]`
- Breadcrumbs on collection and product pages
- Below-fold SEO content on PLP pages (category description + keywords)

#### Performance Targets
- Lighthouse Score: 90+ on all pages
- LCP < 2.0s on mobile (India 4G benchmark)
- CLS < 0.05
- Images: WebP format, lazy-loaded, `width`/`height` set
- Fonts: Fontshare + Google Fonts with `preconnect` + `font-display: swap`
- JS: deferred, code-split by route

#### Pre-Launch QA Checklist
- [ ] All 15 MVP must-haves functional and tested
- [ ] OTP login tested on real phone numbers
- [ ] Razorpay payment live mode tested (₹1 test order)
- [ ] COD order flow end-to-end
- [ ] Shiprocket tracking confirmed working
- [ ] Admin panel: add product, process order, update status all tested
- [ ] All pages at 375px and 1280px — no overflow or layout breaks
- [ ] Dark/light mode (if applicable), all states: empty cart, no search results, OOS
- [ ] GST invoice PDF generation tested
- [ ] WhatsApp button confirmed on all pages
- [ ] All policy pages reviewed for legal accuracy
- [ ] Sitemap submitted to Google Search Console

---

## Phase 2 — Growth Features (Weeks 13–20)

### Blog / Content Hub (SEO Moat)
- Blog listing page: `/blog` — latest articles, category filter
- Blog post page: rich editorial layout, author bio, related articles, product linking ("Shop this look")
- Admin: Tiptap editor for blog posts, SEO fields, featured image, category, publish/schedule
- Target: 2 posts/week — "How to style kurta sets for Diwali", "Fabric guide: Cotton vs Linen"

### Loyalty / Wink Points Program
- Earn: ₹1 spent = 1 Wink Point
- Earn on: purchase, first order, birthday, review submission, social share
- Redeem: 100 points = ₹10 discount at checkout
- Admin: configure earn/redeem rates, bonus campaigns ("Double Points Weekend")
- Account portal: Points balance, history, redeem widget at checkout

### Shoppable Instagram / UGC Feed
- Instagram API integration: pull recent posts tagged `#labelwink`
- Curated UGC gallery on homepage
- Admin: approve/pin UGC posts, tag products to posts
- Clicking a UGC post → product quick view overlay

### Abandoned Cart Recovery
- WhatsApp automation (Interakt/AiSensy): trigger 1hr after cart abandonment
- Email automation (Klaviyo): trigger 1hr + 24hr + 3-day sequence
- Dynamic cart contents in message with deep link back to cart
- Admin: view abandoned cart list, manual trigger option

### Lookbook / Editorial Page
- `/lookbook` — seasonal campaign pages with editorial photography
- Each lookbook: curated set of looks with shoppable product tags
- Admin: create lookbooks, upload editorial images, link products

### Gift Cards
- Digital gift cards: ₹500 / ₹1000 / ₹2000 / custom amount
- Sent via email with unique code
- Redemption at checkout (treated like coupon)
- Admin: view issued gift cards, balances

### Product Video Support on PDP
- Upload product video (MP4) per variant in admin
- Video plays inline in gallery (muted autoplay on desktop, tap to play on mobile)

### "Notify Me" for Out-of-Stock
- OOS products show "Notify Me" button instead of ATC
- User enters email/phone → saved to waitlist
- Admin: view waitlist per variant, trigger notification on restock

---

## Phase 3 — Scaling (Month 5 Onwards)

### AI-Powered Recommendations
- Train recommendation model on: purchase history, browse history, wishlist, category affinity
- Homepage: "Recommended for You" section (personalized)
- PDP: "You May Also Like" (collaborative filtering, not just same-category)
- Email: personalized product picks in weekly newsletters

### Advanced Analytics Dashboard
- Funnel analysis: Homepage → PLP → PDP → Cart → Checkout → Order
- Heatmaps (Hotjar / Microsoft Clarity integration)
- Cohort retention: track repeat purchase rate by acquisition month
- Custom UTM reports for Instagram, influencer, paid ads

### Multi-Courier Management
- Shiprocket + Delhivery + DTDC routing by pincode serviceability and cost
- Admin: view all courier options per order, auto-assign or manual assign
- Storefront: show estimated delivery date based on fastest available courier

### Influencer / Affiliate System
- Unique affiliate links per influencer
- Track: clicks, orders, revenue attributed
- Commission payouts via admin
- Influencer dashboard (read-only portal with their stats)

### Size Recommendation Engine
- "Find My Size" quiz: height, weight, body type → size recommendation
- Data-driven: improve with actual order + return data over time

---

## Feature Priority Matrix

| Feature | Phase | Impact | Effort | Priority |
|---|---|---|---|---|
| Full filters + sort on PLP | 1 | High | Medium | P0 |
| Reviews + star ratings on PDP | 1 | High | Medium | P0 |
| WhatsApp floating button | 1 | High | Low | P0 |
| Pincode delivery estimator | 1 | High | Low | P0 |
| Size guide popup per product | 1 | High | Low | P0 |
| Wishlist (account-saved) | 1 | High | Medium | P0 |
| Order tracking page | 1 | High | Medium | P0 |
| COD badge on PDP + Cart | 1 | High | Low | P0 |
| Free shipping progress bar in cart | 1 | High | Low | P0 |
| Scarcity: "Only X left" | 1 | High | Low | P0 |
| OTP login | 1 | High | Medium | P0 |
| Complete the Look cross-sell | 1 | High | Medium | P0 |
| Instant search with previews | 1 | High | High | P0 |
| GST-compliant invoicing | 1 | High | Medium | P0 |
| Admin CMS (banners, homepage) | 1 | High | High | P0 |
| Blog / content hub | 2 | High | Medium | P1 |
| Loyalty / Wink Points | 2 | High | High | P1 |
| Abandoned cart recovery | 2 | High | Medium | P1 |
| Shoppable UGC feed | 2 | Medium | Medium | P1 |
| Lookbook / editorial | 2 | Medium | Medium | P2 |
| Gift cards | 2 | Medium | Low | P2 |
| "Notify Me" OOS alerts | 2 | Medium | Low | P2 |
| AI personalization | 3 | High | Very High | P3 |
| Influencer / affiliate system | 3 | Medium | High | P3 |
| Size recommendation engine | 3 | Medium | High | P3 |

---

## Team Structure Recommendation

| Role | Count | Responsibilities |
|---|---|---|
| Full-Stack Developer (Lead) | 1 | Next.js, Supabase, Razorpay, Shiprocket, Admin |
| Frontend Developer | 1 | Storefront components, animations, mobile QA |
| UI/UX Designer | 1 | Design system, Figma components, photography direction |
| Backend/DevOps | 0.5 | DB migrations, Vercel config, monitoring |
| Content/SEO | 1 | Blog, SEO meta, product descriptions |
| **Total** | **~4.5 FTE** | |

> Solo developer path: Prioritize Phase 1 features in the order listed. Use shadcn/ui and pre-built components to accelerate frontend. Use Supabase auto-generated APIs to minimize backend custom code.

---

## Monitoring & Maintenance

### Uptime & Errors
- Vercel built-in monitoring + alerting
- Sentry for frontend/backend error tracking
- UptimeRobot for external uptime pings

### Performance
- Lighthouse CI on every Vercel deployment
- Core Web Vitals tracked in Google Search Console
- Alert if LCP > 3s on any key page

### Security
- Supabase RLS policies on all tables (users can only read their own orders, wishlists, etc.)
- Admin routes protected by `role = 'admin'` check server-side
- Razorpay webhook signature verification
- Input sanitization on all user-facing forms
- Rate limiting on OTP endpoint (max 3 OTPs / 10 min per phone)

---

## Launch Checklist Summary

### Must-Have at Launch (MVP — all 15)
1. Full filter + sort on all collection pages
2. Reviews + star ratings on PDPs
3. WhatsApp floating button
4. Pincode checker on PDP
5. MRP + discount % on all product cards
6. Size guide popup per product
7. Wishlist (saved to account)
8. Order tracking page (Shiprocket)
9. COD badge + payment info on PDP
10. Return/exchange policy in PDP accordion
11. Free shipping progress bar in cart
12. Trust badge strip below hero
13. OTP login for Indian users
14. Complete account portal (orders, wishlist, addresses)
15. Instant search with image previews

### The 10 Competitor Gaps to Dominate
All competitors share these gaps — Label Wink fills all 10 at launch:
1. ❌→✅ Customer reviews on every PDP
2. ❌→✅ WhatsApp support floating button
3. ❌→✅ Pincode delivery date estimator
4. ❌→✅ Full filter sidebar on collections
5. ❌→✅ Loyalty / Wink Points program (Phase 2)
6. ❌→✅ Order tracking page (Shiprocket)
7. ❌→✅ "Complete the Look" cross-sell
8. ❌→✅ Free shipping progress bar in cart
9. ❌→✅ Scarcity signals ("Only 3 left")
10. ❌→✅ Blog / SEO content hub (Phase 2)

---

*Report prepared based on full competitor audit of Lilium by Shrivha, Pleated Up, and Zing Clothing. All competitor scores and gap analysis are sourced directly from the audit findings.*
