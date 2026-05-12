'use client'
import { useState, useEffect } from 'react'

export type AttributeOption = {
  id: string
  label: string
  type: string
  sort_order: number
}

export type CategoryOption = {
  id: string
  name: string
  slug: string
  sort_order: number
}

export type ProductAttributes = {
  categories:   CategoryOption[]
  sizes:        AttributeOption[]
  sleeve_types: AttributeOption[]
  fits:         AttributeOption[]
  occasions:    AttributeOption[]
  fabrics:      AttributeOption[]
  patterns:     AttributeOption[]
  customs:      AttributeOption[]
  colors:       AttributeOption[]
}

export function useProductAttributes() {
  const [attrs, setAttrs] = useState<ProductAttributes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/storefront/categories').then(r => r.json()),
      fetch('/api/admin/attributes').then(r => r.json()),
    ]).then(([catRes, attrRes]) => {
      setAttrs({
        categories:   catRes.categories    ?? [],
        sizes:        attrRes.sizes        ?? [],
        sleeve_types: attrRes.sleeve_types ?? [],
        fits:         attrRes.fits         ?? [],
        occasions:    attrRes.occasions    ?? [],
        fabrics:      attrRes.fabrics      ?? [],
        patterns:     attrRes.patterns     ?? [],
        customs:      attrRes.customs      ?? [],
        colors:       attrRes.colors       ?? [],
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return { attrs, loading }
}
