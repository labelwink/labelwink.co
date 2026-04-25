'use client'

import { useState } from 'react'
import { Search, Save, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface InventoryItem {
  id: string
  productName: string
  size: string
  color: string
  sku: string
  stock: number
  price: number
  productId: string
}

export default function InventoryClient({ initialData }: { initialData: InventoryItem[] }) {
  const [data, setData] = useState<InventoryItem[]>(initialData)
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const supabase = createClient()

  const filteredData = data.filter(item => 
    item.productName.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  )

  const handleStockChange = (id: string, newStock: string) => {
    const qty = parseInt(newStock) || 0
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, stock: qty } : item
    ))
  }

  const saveStock = async (id: string, stock: number) => {
    setSavingId(id)
    const { error } = await supabase
      .from('product_variants')
      .update({ stock_qty: stock })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update stock')
    } else {
      toast.success('Stock updated')
    }
    setSavingId(null)
  }

  return (
    <div className="bg-white border border-sage/20 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-sage/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center bg-sage/5 rounded-lg px-4 py-2 w-full max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input
            placeholder="Search by product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Showing {filteredData.length} variants
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-sage/5">
            <TableRow className="border-sage/10">
              <TableHead className="text-charcoal font-bold h-14">Product</TableHead>
              <TableHead className="text-charcoal font-bold h-14">SKU</TableHead>
              <TableHead className="text-charcoal font-bold h-14 text-center">Variant</TableHead>
              <TableHead className="text-charcoal font-bold h-14 text-center">Current Stock</TableHead>
              <TableHead className="text-charcoal font-bold h-14 text-center">Status</TableHead>
              <TableHead className="text-charcoal font-bold h-14 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id} className="border-sage/10 hover:bg-sage/5 transition-colors">
                <TableCell className="py-4 font-medium text-charcoal">
                  {item.productName}
                </TableCell>
                <TableCell className="py-4 text-xs font-mono text-muted-foreground uppercase">
                  {item.sku}
                </TableCell>
                <TableCell className="py-4 text-center">
                  <span className="inline-flex gap-2">
                    <span className="px-2 py-0.5 bg-sage/10 rounded text-[10px] font-bold uppercase">{item.size}</span>
                    <span className="px-2 py-0.5 bg-sage/10 rounded text-[10px] font-bold uppercase">{item.color}</span>
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex justify-center">
                    <Input 
                      type="number"
                      value={item.stock}
                      onChange={(e) => handleStockChange(item.id, e.target.value)}
                      onBlur={() => saveStock(item.id, item.stock)}
                      className="w-20 text-center h-9 font-semibold"
                    />
                  </div>
                </TableCell>
                <TableCell className="py-4 text-center">
                  {item.stock === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      <AlertCircle size={10} /> Out of Stock
                    </span>
                  ) : item.stock < 5 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      <AlertCircle size={10} /> Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      In Stock
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-4 text-right">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-9 px-3 gap-2 text-teal hover:text-teal hover:bg-teal/5"
                    onClick={() => saveStock(item.id, item.stock)}
                    disabled={savingId === item.id}
                  >
                    {savingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
