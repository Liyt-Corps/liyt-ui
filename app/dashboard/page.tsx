'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from './components/DashboardLayout';
import { OrderStatsSummary, OrderStats } from './components/OrderStatsSummary';
import { ShoppingCart, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { fetchCurrentUser } from '@/lib/features/auth/authSlice';
import { useAuthCheck } from '@/lib/hooks/useAuthCheck';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, business, accessToken } = useAppSelector((state) => state.auth);
  
  // Use auth check hook - redirects to login if not authenticated
  const { isAuthenticated, isLoading } = useAuthCheck({ requireAuth: true, redirectTo: '/login' });

  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pending: 0,
    inTransit: 0,
    completed: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);

  const fetchDeliveries = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/deliveries`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Calculate stats
        const total = data.length;
        const pending = data.filter((d: any) => d.status === 'awaiting_recipient' || d.status === 'pending').length;
        const inTransit = data.filter((d: any) => d.status === 'accepted' || d.status === 'picked_up' || d.status === 'in_transit').length;
        const completed = data.filter((d: any) => d.status === 'delivered').length;
        
        setStats({
          totalOrders: total,
          pending,
          inTransit,
          completed,
        });

        // Set recent deliveries (assuming they are sorted by newest first from API, take top 5)
        setRecentDeliveries(data.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    }
  }, [accessToken]);

  useEffect(() => {
    // Fetch current user data if authenticated
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, user, dispatch]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchDeliveries();
    }
  }, [isAuthenticated, accessToken, fetchDeliveries]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E4FF2C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Format date helper
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getStatusMessage = (delivery: any) => {
    const id = delivery.public_id || `ORD-${delivery.id}`;
    switch (delivery.status) {
      case 'delivered': return `Order #${id} completed successfully`;
      case 'in_transit': 
      case 'accepted':
      case 'picked_up': return `Order #${id} marked as In Transit`;
      case 'awaiting_recipient':
      case 'pending': return `New order #${id} created`;
      case 'cancelled': return `Order #${id} was cancelled`;
      default: return `Order #${id} status updated to ${delivery.status}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-400';
      case 'in_transit': 
      case 'accepted':
      case 'picked_up': return 'bg-[#E4FF2C]';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-white/30';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 mt-1">
            Welcome back{business?.name ? ` to ${business.name}` : ''}
            {user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </p>
        </div>

        {/* Stats Grid */}
        <OrderStatsSummary stats={stats} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#141414] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link
                  href="/dashboard/orders"
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div>
                    <h3 className="text-white font-medium">View Orders</h3>
                    <p className="text-white/50 text-sm">Manage and track all orders</p>
                  </div>
                  <Rocket className="w-5 h-5 text-[#E4FF2C]" />
                </Link>
                <Link
                  href="/dashboard/orders?newOrder=true"
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div>
                    <h3 className="text-white font-medium">Create New Order</h3>
                    <p className="text-white/50 text-sm">Add a new shipment</p>
                  </div>
                  <ShoppingCart className="w-5 h-5 text-[#E4FF2C]" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDeliveries.length > 0 ? (
                  recentDeliveries.map((delivery) => (
                    <Link 
                      href={`/dashboard/orders/${delivery.id}`}
                      key={delivery.id} 
                      className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-2 h-2 ${getStatusColor(delivery.status)} rounded-full mt-2 shrink-0`} />
                      <div>
                        <p className="text-white text-sm group-hover:text-[#E4FF2C] transition-colors">{getStatusMessage(delivery)}</p>
                        <p className="text-white/50 text-xs mt-0.5">
                          {formatTimeAgo(delivery.updated_at || delivery.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-white/50 text-sm py-4">
                    No recent activity found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
