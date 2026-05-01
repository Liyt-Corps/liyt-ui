'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../components/DashboardLayout';
import { OrderStatsSummary, OrderStats } from '../components/OrderStatsSummary';
import { StatusBadge } from '../components/StatusBadge';
import { CreateOrderModal } from '../components/CreateOrderModal';
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  MapPin,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';
import { useAuthCheck } from '@/lib/hooks/useAuthCheck';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ITEMS_PER_PAGE = 10;

interface DeliveryStop {
  id: number;
  kind: string;
  address1?: string;
  city?: string;
  region?: string;
  contact_name?: string;
  contact_phone?: string;
}

interface DeliveryItem {
  id: number;
  name: string;
  quantity: number;
}

interface Delivery {
  id: number;
  public_id: string;
  status: string;
  price: number;
  description?: string;
  business_id: number;
  driver_id: number | null;
  customer_id: number | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  stops?: DeliveryStop[];
  items?: DeliveryItem[];
}

// Interface imported from OrderStatsSummary

export default function OrdersPage() {
  const { accessToken } = useAppSelector((state) => state.auth);
  
  // Use auth check hook - redirects to login if not authenticated
  useAuthCheck({ requireAuth: true, redirectTo: '/login' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pending: 0,
    inTransit: 0,
    completed: 0,
  });

  const fetchDeliveries = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/deliveries`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
        
        // Calculate stats
        const total = data.length;
        const pending = data.filter((d: Delivery) => d.status === 'awaiting_recipient' || d.status === 'pending').length;
        const inTransit = data.filter((d: Delivery) => d.status === 'accepted' || d.status === 'picked_up' || d.status === 'in_transit').length;
        const completed = data.filter((d: Delivery) => d.status === 'delivered').length;
        
        setStats({
          totalOrders: total,
          pending,
          inTransit,
          completed,
        });
      } else {
        toast.error('Failed to load orders', { description: 'Please try again later' });
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      toast.error('Network error', { description: 'Unable to connect to the server' });
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return deliveries;
    
    const query = searchQuery.toLowerCase();
    return deliveries.filter((order) =>
      order.public_id?.toLowerCase().includes(query) ||
      order.description?.toLowerCase().includes(query) ||
      order.status?.toLowerCase().includes(query)
    );
  }, [deliveries, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startItem = filteredOrders.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length);

  const handleOrderCreated = () => {
    fetchDeliveries();
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!accessToken) {
      toast.error('Error', { description: 'Please log in to cancel an order' });
      return;
    }

    const order = deliveries.find(d => d.id === orderId);
    if (!order) return;

    // Check if order can be cancelled
    if (order.status !== 'awaiting_recipient' && order.status !== 'pending') {
      toast.error('Cannot cancel', { description: 'This order cannot be cancelled at its current status' });
      return;
    }

    setCancellingId(orderId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/deliveries/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast.success('Order cancelled', { description: 'The order has been cancelled successfully' });
        fetchDeliveries();
      } else if (response.status === 422) {
        toast.error('Cannot cancel', { description: 'This order cannot be cancelled at its current stage' });
      } else {
        toast.error('Failed to cancel order', { description: 'Please try again later' });
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Network error', { description: 'Unable to connect to the server' });
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getItemNames = (items?: DeliveryItem[]) => {
    if (!items || items.length === 0) return '-';
    if (items.length === 1) return items[0].name;
    return `${items[0].name} (+${items.length - 1} more)`;
  };

  const getPickupLocation = (stops?: DeliveryStop[]) => {
    if (!stops) return '-';
    const pickup = stops.find(s => s.kind === 'pickup');
    if (!pickup) return '-';
    return pickup.address1 || pickup.city || 'Pickup';
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Orders Management</h1>
            <p className="text-white/50 mt-1">Real-time logistics tracking and processing</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={fetchDeliveries}
            >
              <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Suspense fallback={<Button variant="outline" className="border-white/20 text-white"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</Button>}>
              <CreateOrderModal onOrderCreated={handleOrderCreated} />
            </Suspense>
          </div>
        </div>

        {/* Stats Cards */}
        <OrderStatsSummary stats={stats} />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              placeholder="Search by Order ID or Description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-[#141414] border-white/10 text-white placeholder:text-white/50 focus:border-[#E4FF2C] focus:ring-[#E4FF2C]"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-[#141414] rounded-lg border border-white/10 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#E4FF2C] animate-spin" />
              <span className="ml-3 text-white/50">Loading orders...</span>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <ShoppingCart className="w-12 h-12 text-white/30 mb-4" />
              <p className="text-white/50 text-lg">No orders found</p>
              <p className="text-white/30 text-sm mt-1">Create your first order to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium">Order ID</TableHead>
                  <TableHead className="text-white/50 font-medium">Items</TableHead>
                  <TableHead className="text-white/50 font-medium">Pickup Location</TableHead>
                  <TableHead className="text-white/50 font-medium">Date</TableHead>
                  <TableHead className="text-white/50 font-medium">Price</TableHead>
                  <TableHead className="text-white/50 font-medium">Status</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-[#E4FF2C] hover:underline"
                      >
                        {order.public_id || `ORD-${order.id}`}
                      </Link>
                    </TableCell>
                    <TableCell className="text-white/80">{getItemNames(order.items)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-white/70">
                        <MapPin className="w-4 h-4 text-white/40" />
                        {getPickupLocation(order.stops)}
                      </div>
                    </TableCell>
                    <TableCell className="text-white/70">{formatDate(order.created_at)}</TableCell>
                    <TableCell className="text-white/70">
                      {order.price ? `ETB ${Number(order.price).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/50 hover:text-white hover:bg-white/10"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#1a1a1a] border-white/10"
                        >
                          <DropdownMenuItem asChild className="text-white hover:bg-white/10 cursor-pointer">
                            <Link href={`/dashboard/orders/${order.id}`} className="flex items-center">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer">
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                            disabled={cancellingId === order.id || (order.status !== 'awaiting_recipient' && order.status !== 'pending')}
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            {cancellingId === order.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Order
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-white/50 text-sm">
              Showing {startItem}-{endItem} of {filteredOrders.length} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={
                    currentPage === i + 1
                      ? 'bg-[#E4FF2C] text-[#0a0a0a] hover:bg-[#E4FF2C]/90'
                      : 'border-white/20 text-white hover:bg-white/10'
                  }
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
