'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Plus, Search, MoreHorizontal, ArrowUpDown, Tag, Loader2 } from 'lucide-react';
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
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order_amount: number;
  used_count: number;
  max_uses: number | null;
  is_active: boolean;
  valid_to: string | null;
};

export const columns: ColumnDef<Coupon>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent font-semibold">
        Coupon Code <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-bold text-charcoal uppercase tracking-wider">{row.getValue("code")}</div>,
  },
  {
    accessorKey: "type",
    header: "Discount Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <span className="flex items-center gap-1.5 text-sm capitalize">
          <Tag className="w-3 h-3 text-teal" /> {type.replace('_', ' ')}
        </span>
      )
    }
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => {
      const val = row.original.value;
      const type = row.original.type;
      return type === 'percentage' ? `${val}%` : `₹${val.toLocaleString()}`;
    }
  },
  {
    accessorKey: "min_order_amount",
    header: "Min. Order",
    cell: ({ row }) => `₹${Number(row.getValue("min_order_amount")).toLocaleString()}`,
  },
  {
    accessorKey: "used_count",
    header: "Usage",
    cell: ({ row }) => `${row.original.used_count} / ${row.original.max_uses || '∞'}`,
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean;
      return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isActive ? 'Active' : 'Disabled'}
        </span>
      )
    }
  },
  {
    accessorKey: "valid_to",
    header: "Valid Until",
    cell: ({ row }) => {
      const val = row.getValue("valid_to");
      return <div className="text-muted-foreground text-sm">{val ? new Date(val as string).toLocaleDateString() : 'Never'}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Edit Coupon</DropdownMenuItem>
              <DropdownMenuItem>Toggle Status</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];

export default function DiscountsPage() {
  const [data, setData] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const supabase = createClient();

  useEffect(() => {
    async function fetchCoupons() {
      const { data: coupons } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (coupons) setData(coupons);
      setLoading(false);
    }
    fetchCoupons();
  }, []);

  const tableData = useMemo(() => data, [data]);
  const tableColumns = useMemo(() => columns, []);

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
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
          <h1 className="text-3xl font-heading font-semibold text-charcoal">Discounts</h1>
          <p className="text-muted-foreground text-sm mt-1 uppercase tracking-widest text-[10px] font-bold">Manage promo codes and automatic discounts</p>
        </div>
        <Button className="bg-charcoal hover:bg-teal text-white gap-2 h-12 px-6 rounded-none uppercase tracking-widest text-xs font-bold transition-all">
          <Plus className="w-4 h-4" /> Create Coupon
        </Button>
      </div>

      <div className="bg-white border border-sage/20 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center bg-sage/5 border border-sage/10 rounded-lg px-4 py-2 w-full max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input
              placeholder="Search coupon code..."
              value={(table.getColumn("code")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("code")?.setFilterValue(event.target.value)
              }
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
        </div>

        <div className="rounded-xl border border-sage/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-sage/5">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-sage/10">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-charcoal font-bold h-14">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal" />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border-sage/10 hover:bg-sage/5 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No coupons found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
