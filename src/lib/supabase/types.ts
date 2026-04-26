// ─────────────────────────────────────────────────────────────────────────────
// LabelWink — Supabase Database Types
// Auto-generated shape + manual extensions.
// Run `npx supabase gen types typescript` to regenerate from live schema.
// ─────────────────────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          compare_at_price: number | null
          category_id: string | null
          visible: boolean
          status: 'draft' | 'published' | 'archived'
          fabric: string | null
          occasion: string | null
          fit: string | null
          season: string | null
          tags: string[] | null
          hsn_code: string | null
          weight: number | null
          size_chart_data: Json | null
          meta_title: string | null
          meta_description: string | null
          og_image_url: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          size: string
          color: string | null
          sku: string | null
          stock_qty: number
          price: number | null
          image_url: string | null
          low_stock_threshold: number
          warehouse_location: string | null
          reorder_qty: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt: string | null
          sort_order: number
          is_cover: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_images']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          status: string
          total: number
          subtotal: number
          shipping_amount: number
          discount_amount: number
          points_redeemed: number
          shipping_method: string
          shipping_state: string | null
          is_inter_state: boolean
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          shipping_address: Json | null
          admin_note: string | null
          razorpay_payment_id: string | null
          razorpay_order_id: string | null
          razorpay_signature: string | null
          shipping_carrier: string | null
          tracking_number: string | null
          tracking_url: string | null
          shiprocket_order_id: string | null
          shiprocket_awb: string | null
          label_url: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string | null
          product_name: string
          size: string | null
          color: string | null
          sku: string | null
          quantity: number
          price: number
          image_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: string
          note: string | null
          changed_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_status_history']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['order_status_history']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          order_id: string
          invoice_number: string
          issued_at: string
          subtotal: number | null
          cgst: number
          sgst: number
          igst: number
          shipping: number
          discount: number
          total: number | null
          data: Json | null
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'issued_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      return_requests: {
        Row: {
          id: string
          order_id: string
          user_id: string
          reason: string | null
          description: string | null
          photo_urls: string[] | null
          status: string
          refund_amount: number | null
          refund_method: string
          razorpay_refund_id: string | null
          admin_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['return_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['return_requests']['Insert']>
      }
      discount_codes: {
        Row: {
          id: string
          code: string
          type: 'percentage' | 'flat' | 'bogo' | 'free_shipping'
          value: number
          min_order_amount: number
          max_uses: number | null
          used_count: number
          single_use_per_customer: boolean
          starts_at: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['discount_codes']['Row'], 'id' | 'created_at' | 'used_count'>
        Update: Partial<Database['public']['Tables']['discount_codes']['Insert']>
      }
      discount_code_uses: {
        Row: {
          id: string
          discount_code_id: string
          user_id: string
          order_id: string | null
          used_at: string
        }
        Insert: Omit<Database['public']['Tables']['discount_code_uses']['Row'], 'id' | 'used_at'>
        Update: Partial<Database['public']['Tables']['discount_code_uses']['Insert']>
      }
      loyalty_points: {
        Row: {
          id: string
          user_id: string
          balance: number
          lifetime_earned: number
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['loyalty_points']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['loyalty_points']['Insert']>
      }
      loyalty_transactions: {
        Row: {
          id: string
          user_id: string
          points: number
          type: 'earn' | 'redeem' | 'bonus' | 'expire' | 'referral' | 'birthday'
          reason: string | null
          order_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['loyalty_transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['loyalty_transactions']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          email: string | null
          avatar_url: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          chest: number | null
          waist: number | null
          hips: number | null
          height: number | null
          weight: number | null
          role: 'customer' | 'admin' | 'store_manager' | 'warehouse' | 'support' | 'finance'
          referral_code: string | null
          referred_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: 'Home' | 'Office' | 'Other'
          full_name: string | null
          phone: string | null
          line1: string | null
          line2: string | null
          city: string | null
          state: string | null
          pincode: string | null
          country: string
          is_default: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['addresses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          order_id: string | null
          rating: number
          title: string | null
          body: string | null
          status: 'pending' | 'approved' | 'rejected'
          is_verified_purchase: boolean
          admin_reply: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string | null
          added_at: string
        }
        Insert: Omit<Database['public']['Tables']['wishlists']['Row'], 'id' | 'added_at'>
        Update: Partial<Database['public']['Tables']['wishlists']['Insert']>
      }
      banners: {
        Row: {
          id: string
          title: string | null
          image_url: string | null
          mobile_image_url: string | null
          target_url: string | null
          position: 'hero' | 'category' | 'sidebar' | 'announcement'
          starts_at: string | null
          ends_at: string | null
          is_active: boolean
          sort_order: number
          variant_a_url: string | null
          variant_b_url: string | null
          click_count_a: number
          click_count_b: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['banners']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['banners']['Insert']>
      }
      pages: {
        Row: {
          id: string
          slug: string
          title: string | null
          meta_title: string | null
          meta_description: string | null
          content: Json | null
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['pages']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['pages']['Insert']>
      }
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string | null
          body: string | null
          excerpt: string | null
          cover_image_url: string | null
          author_name: string | null
          tags: string[] | null
          meta_title: string | null
          meta_description: string | null
          og_image_url: string | null
          related_product_ids: string[] | null
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['blog_posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>
      }
      shop_settings: {
        Row: {
          id: number
          store_name: string
          store_email: string | null
          store_phone: string | null
          store_address: string | null
          store_state: string
          gst_number: string | null
          logo_url: string | null
          currency: string
          free_shipping_threshold: number
          standard_shipping_rate: number
          express_shipping_rate: number
          loyalty_points_per_rupee: number
          points_to_rupee_ratio: number
          return_window_days: number
          low_stock_notify_email: string | null
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['shop_settings']['Row']>
        Update: Partial<Database['public']['Tables']['shop_settings']['Row']>
      }
      audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          admin_email: string | null
          action: string | null
          entity: string | null
          entity_id: string | null
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      admin_notifications: {
        Row: {
          id: string
          type: string
          title: string | null
          body: string | null
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admin_notifications']['Insert']>
      }
      email_templates: {
        Row: {
          id: string
          name: string
          subject: string | null
          html_body: string | null
          variables: string[] | null
          is_active: boolean
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['email_templates']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['email_templates']['Insert']>
      }
      collections: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          is_featured: boolean
          sort_order: number
          meta_title: string | null
          meta_description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['collections']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['collections']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          image_url: string | null
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
