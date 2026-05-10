import ProductForm from '@/components/admin/ProductForm'

export const metadata = { title: 'Add Product' }

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-[#6b7280] mb-1">Admin › Products › <span className="text-[#1b3a34]">Add Product</span></nav>
        <h1 className="text-2xl font-bold text-[#1b3a34]">Add Product</h1>
      </div>
      <ProductForm />
    </div>
  )
}
