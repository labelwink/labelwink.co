'use client';

import { useState, useEffect } from 'react';
import { 
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Plus, Search, MoreHorizontal, ArrowUpDown, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  stock: number;
  status: 'Active' | 'Draft';
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent font-semibold">
          Product Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-charcoal">{row.getValue("name")}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{row.original.slug}</span>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      )
    }
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      return (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${stock < 5 ? 'text-destructive' : 'text-charcoal'}`}>{stock}</span>
          {stock < 5 && <span className="text-[9px] font-bold uppercase text-destructive">Low</span>}
        </div>
      )
    }
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount)
 
      return <div className="text-right font-medium text-charcoal">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={`/products/${product.slug}`} target="_blank">
                <DropdownMenuItem className="gap-2">
                  <ExternalLink size={14} /> View Storefront
                </DropdownMenuItem>
              </Link>
              <Link href={`/admin/products/${product.id}/edit`}>
                <DropdownMenuItem>Edit Details</DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
                    // Call delete logic here
                  }
                }}
              >
                Delete Product
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const supabase = createClient();

  useEffect(() => {
    async function fetchProducts() {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, is_active,
          categories(name),
          product_variants(price, stock_qty)
        `)
        .order('created_at', { ascending: false });
      
      if (products) {
        const transformed = products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: (p.categories as any)?.name || 'Uncategorized',
          price: (p.product_variants as any)?.[0]?.price || 0,
          stock: (p.product_variants as any)?.reduce((acc: number, v: any) => acc + v.stock_qty, 0) || 0,
          status: (p.is_active ? 'Active' : 'Draft') as any
        }));
        setData(transformed);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-charcoal">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your collection, inventory, and pricing.</p>
        </div>
        <Link href="/admin/products/add">
          <Button className="bg-teal hover:bg-teal/90 text-white gap-2 h-12 px-6">
            <Plus className="w-4 h-4" /> Add New Product
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-sage/20 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-sage/10">
          <div className="flex items-center bg-sage/5 rounded-lg px-4 py-2 w-full max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input
              placeholder="Search by name or slug..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-4"><TableSkeleton rows={10} /></div>
        ) : data.length === 0 ? (
          <EmptyState 
            icon="📦" 
            title="No products yet" 
            description="Start building your catalog by adding your first product."
            action={{ label: "Add Product", href: "/admin/products/add" }}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-sage/5">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-sage/10">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="text-charcoal font-bold h-14">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-sage/10 hover:bg-sage/5 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="flex items-center justify-end space-x-2 p-4 border-t border-sage/10 bg-sage/5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-10"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-10"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
