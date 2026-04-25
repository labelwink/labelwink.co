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
import { Search, MoreHorizontal, ArrowUpDown, Loader2, Package, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
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

type Order = {
  id: string;
  customer_name: string;
  email: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
};

const statusConfig: any = {
  pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Pending' },
  processing: { icon: Package, color: 'text-blue-600 bg-blue-100', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-purple-600 bg-purple-100', label: 'Shipped' },
  delivered: { icon: CheckCircle2, color: 'text-green-600 bg-green-100', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Cancelled' },
};

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => <span className="font-mono text-xs uppercase">#{row.getValue("id")?.toString().slice(-6)}</span>,
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent font-semibold">
        Date <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const config = statusConfig[status] || statusConfig.pending;
      const Icon = config.icon;
      return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      );
    }
  },
  {
    accessorKey: "total",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
              <DropdownMenuItem>Processing</DropdownMenuItem>
              <DropdownMenuItem>Shipped</DropdownMenuItem>
              <DropdownMenuItem>Delivered</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Cancel Order</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];

export default function AdminOrdersPage() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const supabase = createClient();

  useEffect(() => {
    async function fetchOrders() {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (orders) {
        const transformed = orders.map(o => ({
          id: o.id,
          customer_name: (o.shipping_address as any)?.name || 'Guest',
          email: o.email,
          total: o.total_amount,
          status: o.status,
          payment_status: o.payment_status,
          created_at: o.created_at
        }));
        setData(transformed);
      }
      setLoading(false);
    }
    fetchOrders();
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
      <div>
        <h1 className="text-3xl font-heading font-semibold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Track and manage your customer orders.</p>
      </div>

      <div className="bg-white border border-sage/20 rounded-md shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center border border-sage/30 rounded-md px-3 py-2 w-full max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input
              placeholder="Search by name or ID..."
              value={(table.getColumn("customer_name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("customer_name")?.setFilterValue(event.target.value)
              }
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
        </div>

        <div className="rounded-md border border-sage/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-sage/5">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-sans">
                    No orders placed yet.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
