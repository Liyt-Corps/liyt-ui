'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Map,
  MapMarker,
  MapPopup,
  MapTileLayer,
  MapZoomControl,
} from '@/components/ui/map';
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Phone,
  Truck,
  Clock,
  CheckCircle2,
  Circle,
  Edit,
  Printer,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';
import { useAuthCheck } from '@/lib/hooks/useAuthCheck';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Dark theme map tiles - CartoDB Dark Matter
const darkTileLayer = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

interface DeliveryStop {
  id: number;
  kind: string;
  sequence: number;
  address1?: string;
  address2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country_code?: string;
  latitude?: string;
  longitude?: string;
  contact_name?: string;
  contact_phone?: string;
  instructions?: string;
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
  stops: DeliveryStop[];
  items: DeliveryItem[];
}

interface TimelineEvent {
  status: string;
  date: string | null;
  description: string;
  completed: boolean;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAppSelector((state) => state.auth);
  
  // Use auth check hook - redirects to login if not authenticated
  const { isAuthenticated, isLoading: authLoading } = useAuthCheck({ requireAuth: true, redirectTo: '/login' });
  
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDelivery = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(`${API_BASE_URL}/deliveries/${params.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setDelivery(data);
        } else if (response.status === 404) {
          setError('Order not found');
        } else {
          setError('Failed to load order');
        }
      } catch (err) {
        console.error('Failed to fetch delivery:', err);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchDelivery();
  }, [accessToken, params.id]);

  const handleCancelOrder = async () => {
    if (!accessToken || !delivery) return;

    if (delivery.status !== 'awaiting_recipient' && delivery.status !== 'pending') {
      toast.error('Cannot cancel', { description: 'This order cannot be cancelled at its current status' });
      return;
    }

    setCancelling(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/deliveries/${delivery.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast.success('Order cancelled', { description: 'The order has been cancelled successfully' });
        // Refresh the delivery data
        const refreshResponse = await fetch(`${API_BASE_URL}/deliveries/${params.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setDelivery(data);
        }
      } else if (response.status === 422) {
        toast.error('Cannot cancel', { description: 'This order cannot be cancelled at its current stage' });
      } else {
        toast.error('Failed to cancel order', { description: 'Please try again later' });
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Network error', { description: 'Unable to connect to the server' });
    } finally {
      setCancelling(false);
    }
  };

  const getTimelineEvents = (): TimelineEvent[] => {
    if (!delivery) return [];

    const events: TimelineEvent[] = [
      {
        status: 'Order Created',
        date: delivery.created_at,
        description: 'Order has been created and is awaiting recipient confirmation',
        completed: true,
      },
    ];

    if (delivery.status === 'awaiting_recipient') {
      events.push({
        status: 'Awaiting Confirmation',
        date: null,
        description: 'Waiting for recipient to confirm delivery address',
        completed: false,
      });
    }

    if (delivery.accepted_at || delivery.status === 'accepted' || delivery.status === 'pending') {
      events.push({
        status: 'Accepted',
        date: delivery.accepted_at,
        description: 'Order has been accepted and assigned to a driver',
        completed: !!delivery.accepted_at,
      });
    }

    if (delivery.picked_up_at || delivery.status === 'picked_up' || delivery.status === 'in_transit') {
      events.push({
        status: 'Picked Up',
        date: delivery.picked_up_at,
        description: 'Package has been picked up from origin',
        completed: !!delivery.picked_up_at,
      });
    }

    if (delivery.delivered_at || delivery.status === 'delivered') {
      events.push({
        status: 'Delivered',
        date: delivery.delivered_at,
        description: 'Package has been delivered successfully',
        completed: !!delivery.delivered_at,
      });
    }

    if (delivery.cancelled_at || delivery.status === 'cancelled') {
      events.push({
        status: 'Cancelled',
        date: delivery.cancelled_at,
        description: 'Order has been cancelled',
        completed: true,
      });
    }

    return events;
  };

  const getPickupStop = () => delivery?.stops?.find(s => s.kind === 'pickup');
  const getDropoffStop = () => delivery?.stops?.find(s => s.kind === 'dropoff');

  const getMapCenter = (): [number, number] => {
    const pickup = getPickupStop();
    const dropoff = getDropoffStop();
    
    const pickupLat = pickup?.latitude ? parseFloat(pickup.latitude) : 9.03;
    const pickupLng = pickup?.longitude ? parseFloat(pickup.longitude) : 38.74;
    
    if (dropoff?.latitude && dropoff?.longitude) {
      const dropoffLat = parseFloat(dropoff.latitude);
      const dropoffLng = parseFloat(dropoff.longitude);
      return [(pickupLat + dropoffLat) / 2, (pickupLng + dropoffLng) / 2];
    }
    
    return [pickupLat, pickupLng];
  };

  const getPickupCoords = (): [number, number] => {
    const pickup = getPickupStop();
    if (pickup?.latitude && pickup?.longitude) {
      return [parseFloat(pickup.latitude), parseFloat(pickup.longitude)];
    }
    return [9.03, 38.74];
  };

  const getDropoffCoords = (): [number, number] | null => {
    const dropoff = getDropoffStop();
    if (dropoff?.latitude && dropoff?.longitude) {
      return [parseFloat(dropoff.latitude), parseFloat(dropoff.longitude)];
    }
    return null;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (stop: DeliveryStop | undefined) => {
    if (!stop) return '-';
    const parts = [stop.address1, stop.city, stop.region].filter(Boolean);
    return parts.join(', ') || '-';
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-[#E4FF2C] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-[#E4FF2C] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !delivery) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard/orders')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Order Not Found</h1>
            <p className="text-white/50 mb-4">{error || 'The order you are looking for does not exist.'}</p>
            <Button
              onClick={() => router.push('/dashboard/orders')}
              className="bg-[#E4FF2C] text-[#0a0a0a]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const timelineEvents = getTimelineEvents();
  const pickup = getPickupStop();
  const dropoff = getDropoffStop();
  const mapCenter = getMapCenter();
  const pickupCoords = getPickupCoords();
  const dropoffCoords = getDropoffCoords();

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard/orders')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{delivery.public_id || `ORD-${delivery.id}`}</h1>
                <StatusBadge status={delivery.status} />
              </div>
              <p className="text-white/50 mt-1">Created on {formatDate(delivery.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {(delivery.status === 'awaiting_recipient' || delivery.status === 'pending') && (
              <Button
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Order'
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Card */}
            <Card className="bg-[#141414] border-white/10 overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#E4FF2C]" />
                  Route Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[400px] w-full">
                  <Map
                    center={mapCenter}
                    zoom={13}
                    className="h-full w-full"
                  >
                    <MapTileLayer
                      url={darkTileLayer.url}
                      attribution={darkTileLayer.attribution}
                    />
                    <MapZoomControl />
                    {/* Pickup Marker */}
                    <MapMarker position={pickupCoords}>
                      <MapPopup>
                        <div className="p-2">
                          <p className="font-semibold">Pickup Location</p>
                          <p className="text-sm text-gray-600">{formatAddress(pickup)}</p>
                        </div>
                      </MapPopup>
                    </MapMarker>
                    {/* Dropoff Marker */}
                    {dropoffCoords && (
                      <MapMarker position={dropoffCoords}>
                        <MapPopup>
                          <div className="p-2">
                            <p className="font-semibold">Dropoff Location</p>
                            <p className="text-sm text-gray-600">{formatAddress(dropoff)}</p>
                          </div>
                        </MapPopup>
                      </MapMarker>
                    )}
                  </Map>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-[#141414] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#E4FF2C]" />
                  Delivery Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {timelineEvents.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        {event.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-[#E4FF2C]" />
                        ) : (
                          <Circle className="w-6 h-6 text-white/30" />
                        )}
                        {index < timelineEvents.length - 1 && (
                          <div
                            className={`w-0.5 h-full mt-2 ${
                              event.completed ? 'bg-[#E4FF2C]/30' : 'bg-white/10'
                            }`}
                          />
                        )}
                      </div>
                      <div className="pb-6">
                        <h4 className={`font-medium ${event.completed ? 'text-white' : 'text-white/50'}`}>
                          {event.status}
                        </h4>
                        <p className="text-sm text-[#E4FF2C]">{formatDate(event.date)}</p>
                        <p className="text-sm text-white/50 mt-1">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Order Info */}
            <Card className="bg-[#141414] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#E4FF2C]" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-white/50 text-sm">Order ID</p>
                  <p className="text-white font-medium">{delivery.public_id || `ORD-${delivery.id}`}</p>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <p className="text-white/50 text-sm">Order Date</p>
                  <p className="text-white font-medium">{formatDate(delivery.created_at)}</p>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <p className="text-white/50 text-sm">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={delivery.status} />
                  </div>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <p className="text-white/50 text-sm">Price</p>
                  <p className="text-white font-medium">
                    {delivery.price ? `ETB ${Number(delivery.price).toFixed(2)}` : '-'}
                  </p>
                </div>
                {delivery.description && (
                  <>
                    <Separator className="bg-white/10" />
                    <div>
                      <p className="text-white/50 text-sm">Description</p>
                      <p className="text-white font-medium">{delivery.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pickup Details */}
            <Card className="bg-[#141414] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#E4FF2C]" />
                  Pickup Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-white/50 text-sm">Location</p>
                  <p className="text-white font-medium">{formatAddress(pickup)}</p>
                </div>
                {pickup?.contact_name && (
                  <>
                    <Separator className="bg-white/10" />
                    <div>
                      <p className="text-white/50 text-sm">Contact Person</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-white/50" />
                        <p className="text-white">{pickup.contact_name}</p>
                      </div>
                    </div>
                  </>
                )}
                {pickup?.contact_phone && (
                  <>
                    <Separator className="bg-white/10" />
                    <div>
                      <p className="text-white/50 text-sm">Contact Info</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-white/50" />
                        <p className="text-white">{pickup.contact_phone}</p>
                      </div>
                    </div>
                  </>
                )}
                {pickup?.instructions && (
                  <>
                    <Separator className="bg-white/10" />
                    <div>
                      <p className="text-white/50 text-sm">Instructions</p>
                      <p className="text-white text-sm mt-1">{pickup.instructions}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dropoff Details */}
            <Card className="bg-[#141414] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#E4FF2C]" />
                  Dropoff Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dropoff ? (
                  <>
                    <div>
                      <p className="text-white/50 text-sm">Location</p>
                      <p className="text-white font-medium">{formatAddress(dropoff)}</p>
                    </div>
                    {dropoff.contact_name && (
                      <>
                        <Separator className="bg-white/10" />
                        <div>
                          <p className="text-white/50 text-sm">Contact Person</p>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="w-4 h-4 text-white/50" />
                            <p className="text-white">{dropoff.contact_name}</p>
                          </div>
                        </div>
                      </>
                    )}
                    {dropoff.contact_phone && (
                      <>
                        <Separator className="bg-white/10" />
                        <div>
                          <p className="text-white/50 text-sm">Contact Info</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4 text-white/50" />
                            <p className="text-white">{dropoff.contact_phone}</p>
                          </div>
                        </div>
                      </>
                    )}
                    {dropoff.instructions && (
                      <>
                        <Separator className="bg-white/10" />
                        <div>
                          <p className="text-white/50 text-sm">Instructions</p>
                          <p className="text-white text-sm mt-1">{dropoff.instructions}</p>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-white/50">Awaiting recipient confirmation</p>
                    <p className="text-white/30 text-sm mt-1">
                      The recipient needs to confirm their delivery address
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Package Info */}
            <Card className="bg-[#141414] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#E4FF2C]" />
                  Package Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-white/50 text-sm">Items</p>
                  <div className="space-y-2 mt-2">
                    {delivery.items?.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <p className="text-white">{item.name}</p>
                        <p className="text-white/70">x{item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
