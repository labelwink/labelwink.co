export function generateProductSchema(
  product: {
    name: string;
    description?: string;
    price: number;
    compare_at_price?: number;
    images: string[];
    slug: string;
    reviews_summary?: { avg_rating: number; total_count: number };
  },
  settings: { store_name: string; store_url: string }
) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description?.slice(0, 300),
    "image": product.images,
    "url": `${settings.store_url}/products/${product.slug}`,
    "brand": {
      "@type": "Brand",
      "name": settings.store_name
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": `${settings.store_url}/products/${product.slug}`,
      "priceValidUntil": new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    }
  };

  if (product.reviews_summary && product.reviews_summary.total_count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.reviews_summary.avg_rating.toFixed(1),
      "reviewCount": product.reviews_summary.total_count,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  return schema;
}

export function generateOrganizationSchema(settings: {
  store_name: string;
  store_url: string;
  logo_url?: string;
  store_email?: string;
  store_phone?: string;
  store_address?: string;
  store_city?: string;
  store_state?: string;
  social_links?: { instagram?: string; facebook?: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": settings.store_name,
    "url": settings.store_url,
    "logo": settings.logo_url,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": settings.store_phone,
      "contactType": "customer service",
      "availableLanguage": ["English", "Tamil"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": settings.store_address,
      "addressLocality": settings.store_city,
      "addressRegion": settings.store_state,
      "addressCountry": "IN"
    },
    "sameAs": [
      settings.social_links?.instagram,
      settings.social_links?.facebook
    ].filter(Boolean)
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
