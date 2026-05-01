'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Map, 
  MapMarker, 
  MapPopup, 
  MapTileLayer 
} from '@/components/ui/map';
import { 
  Package, 
  MapPin, 
  Truck, 
  User, 
  Clock, 
  CheckCircle2,
  Circle,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Dark theme map tiles
const darkTileLayer = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

interface Business {
  name: string;
}

interface Driver {
  full_name: string;
  phone: string;
  vehicle_type: string;
  last_latitude?: string;
  last_longitude?: string;
  last_location_at?: string;
}

interface Pickup {
  address1: string;
  city: string;
  region?: string;
  contact_name: string;
  latitude?: string;
  longitude?: string;
}

interface Dropoff {
  address1: string;
  city: string;
  region?: string;
  contact_name: string;
  latitude?: string;
  longitude?: string;
}

interface Delivery {
  public_id: string;
  status: string;
  price: number;
  description?: string;
  created_at?: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  business?: Business;
  driver?: Driver;
  pickup?: Pickup;
  dropoff?: Dropoff;
}

interface TimelineEvent {
  status: string;
  date: string | null;
  completed: boolean;
}

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid tracking ID');
      setLoading(false);
      return;
    }

    const fetchTracking = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/track/${token}`);
        
        if (response.ok) {
          const data = await response.json();
          setDelivery(data.delivery);
        } else if (response.status === 404) {
          setError('Tracking information not found. Please check your tracking ID.');
        } else if (response.status === 410) {
          setError('This tracking link has expired.');
        } else {
          setError('Unable to load tracking information. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching tracking:', err);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [token]);

  const getTimelineEvents = (): TimelineEvent[] => {
    if (!delivery) return [];

    const statuses = ['awaiting_recipient', 'pending', 'accepted', 'picked_up', 'in_transit', 'delivered'];
    const currentIndex = statuses.indexOf(delivery.status);

    return [
      {
        status: 'Order Created',
        date: delivery.created_at || null,
        completed: true,
      },
      {
        status: 'Confirmed',
        date: delivery.created_at || null,
        completed: currentIndex >= 1,
      },
      {
        status: 'Accepted',
        date: delivery.accepted_at || null,
        completed: currentIndex >= 2,
      },
      {
        status: 'Picked Up',
        date: delivery.picked_up_at || null,
        completed: currentIndex >= 3,
      },
      {
        status: 'In Transit',
        date: delivery.picked_up_at || null,
        completed: currentIndex >= 4,
      },
      {
        status: 'Delivered',
        date: delivery.delivered_at || null,
        completed: currentIndex === 5,
      }
    ];
  };

  const getMapCenter = (): [number, number] => {
    if (!delivery) return [9.03, 38.74];
    
    const pickupLat = delivery.pickup?.latitude ? parseFloat(delivery.pickup.latitude) : 9.03;
    const pickupLng = delivery.pickup?.longitude ? parseFloat(delivery.pickup.longitude) : 38.74;
    
    if (delivery.dropoff?.latitude && delivery.dropoff?.longitude) {
      const dropoffLat = parseFloat(delivery.dropoff.latitude);
      const dropoffLng = parseFloat(delivery.dropoff.longitude);
      return [(pickupLat + dropoffLat) / 2, (pickupLng + dropoffLng) / 2];
    }
    
    return [pickupLat, pickupLng];
  };

  const getPickupCoords = (): [number, number] => {
    if (!delivery?.pickup) return [9.03, 38.74];
    if (delivery.pickup.latitude && delivery.pickup.longitude) {
      return [parseFloat(delivery.pickup.latitude), parseFloat(delivery.pickup.longitude)];
    }
    return [9.03, 38.74];
  };

  const getDropoffCoords = (): [number, number] | null => {
    if (!delivery?.dropoff) return null;
    if (delivery.dropoff.latitude && delivery.dropoff.longitude) {
      return [parseFloat(delivery.dropoff.latitude), parseFloat(delivery.dropoff.longitude)];
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-[#E4FF2C] text-[#0a0a0a]';
      case 'picked_up':
      case 'in_transit':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'accepted':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-transparent border border-white/30 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'awaiting_recipient':
        return 'Awaiting Confirmation';
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'picked_up':
        return 'Picked Up';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null | undefined, completed: boolean) => {
    if (!completed) return 'Pending';
    if (!dateString) return 'Completed';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 pt-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#E4FF2C] animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 pt-4">
        <Card className="bg-[#141414] border-white/10 max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-white">Unable to Track</CardTitle>
            <CardDescription className="text-white/50">{error || 'Tracking information not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-[#E4FF2C] text-[#0a0a0a] hover:bg-[#E4FF2C]/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timelineEvents = getTimelineEvents();
  const pickupCoords = getPickupCoords();
  const dropoffCoords = getDropoffCoords();

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-8 pt-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">Track Delivery</h1>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(delivery.status)}`}>
                  {getStatusLabel(delivery.status)}
                </span>
              </div>
              <p className="text-white/50 mt-1">Order ID: {delivery.public_id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Map & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <Card className="bg-[#141414] border-white/10 overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#E4FF2C]" />
                  Live Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] w-full">
                  <Map
                    center={getMapCenter()}
                    zoom={13}
                    className="h-full w-full"
                  >
                    <MapTileLayer
                      url={darkTileLayer.url}
                      attribution={darkTileLayer.attribution}
                    />
                    {/* Pickup Marker */}
                    <MapMarker position={pickupCoords}>
                      <MapPopup>
                        <div className="p-2">
                          <p className="font-semibold text-black">Pickup Location</p>
                          <p className="text-sm text-gray-600">{delivery.pickup?.address1}, {delivery.pickup?.city}</p>
                        </div>
                      </MapPopup>
                    </MapMarker>
                    {/* Dropoff Marker */}
                    {dropoffCoords && (
                      <MapMarker position={dropoffCoords}>
                        <MapPopup>
                          <div className="p-2">
                            <p className="font-semibold text-black">Delivery Location</p>
                            <p className="text-sm text-gray-600">{delivery.dropoff?.address1}, {delivery.dropoff?.city}</p>
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
                  Delivery Status
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
                        <p className="text-sm text-[#E4FF2C]">{formatDate(event.date, event.completed)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
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
                  <p className="text-white/50 text-sm">Business</p>
                  <p className="text-white font-medium">{delivery.business?.name || '-'}</p>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <p className="text-white/50 text-sm">Description</p>
                  <p className="text-white">{delivery.description || '-'}</p>
                </div>
                {delivery.price > 0 && (
                  <>
                    <Separator className="bg-white/10" />
                    <div>
                      <p className="text-white/50 text-sm">Total Price</p>
                      <p className="text-white font-medium text-xl">ETB {Number(delivery.price).toFixed(2)}</p>
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
                  Pickup Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-white/50 text-sm">Address</p>
                  <p className="text-white font-medium">{delivery.pickup?.address1}, {delivery.pickup?.city}</p>
                </div>
                {delivery.pickup?.contact_name && (
                  <>
                    <Separator className="bg-white/10" />
                    <div>
                      <p className="text-white/50 text-sm">Contact</p>
                      <p className="text-white">{delivery.pickup.contact_name}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dropoff Details */}
            {delivery.dropoff && (
              <Card className="bg-[#141414] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#E4FF2C]" />
                    Delivery Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-white/50 text-sm">Address</p>
                    <p className="text-white font-medium">{delivery.dropoff.address1}, {delivery.dropoff.city}</p>
                  </div>
                  {delivery.dropoff.contact_name && (
                    <>
                      <Separator className="bg-white/10" />
                      <div>
                        <p className="text-white/50 text-sm">Recipient</p>
                        <p className="text-white">{delivery.dropoff.contact_name}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Driver Details */}
            {delivery.driver && (
              <Card className="bg-[#141414] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#E4FF2C]" />
                    Driver Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-white/50 text-sm">Driver Name</p>
                    <p className="text-white font-medium">{delivery.driver.full_name}</p>
                  </div>
                  <Separator className="bg-white/10" />
                  <div>
                    <p className="text-white/50 text-sm">Vehicle</p>
                    <p className="text-white">{delivery.driver.vehicle_type || '-'}</p>
                  </div>
                  <Separator className="bg-white/10" />
                  <div>
                    <p className="text-white/50 text-sm">Contact</p>
                    <p className="text-white">{delivery.driver.phone}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
