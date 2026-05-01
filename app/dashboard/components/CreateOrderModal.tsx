'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Package, Truck, Trash2, Send } from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface BusinessLocation {
  id: number;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country_code: string;
  latitude?: string;
  longitude?: string;
  instructions?: string;
  active: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

interface CreateOrderModalProps {
  onOrderCreated?: () => void;
}

export function CreateOrderModal({ onOrderCreated }: CreateOrderModalProps) {
  const { accessToken } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  
  useEffect(() => {
    if (searchParams.get('newOrder') === 'true') {
      setOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('newOrder');
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, router]);
  
  const [formData, setFormData] = useState({
    recipientEmail: '',
    description: '',
    price: '',
    selectedLocationId: '',
    pickupContactName: '',
    pickupContactPhone: '',
    instructions: '',
  });

  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', name: '', quantity: 1 }
  ]);

  // Fetch business locations
  useEffect(() => {
    const fetchLocations = async () => {
      if (!accessToken) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/business_locations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setLocations(data);
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        toast.error('Error', { description: 'Failed to load business locations' });
      } finally {
        setLoadingLocations(false);
      }
    };

    if (open) {
      fetchLocations();
    }
  }, [open, accessToken]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', quantity: 1 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: 'name' | 'quantity', value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken) {
      toast.error('Error', { description: 'Please log in to create an order' });
      return;
    }

    // Validate items
    const validItems = items.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      toast.error('Error', { description: 'Please add at least one item' });
      return;
    }

    // Get selected location
    const selectedLocation = locations.find(loc => loc.id.toString() === formData.selectedLocationId);
    if (!selectedLocation) {
      toast.error('Error', { description: 'Please select a pickup location' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          description: formData.description || undefined,
          price: formData.price ? parseFloat(formData.price) : undefined,
          recipient_email: formData.recipientEmail,
          pickup: {
            address1: selectedLocation.address1 || selectedLocation.name,
            address2: selectedLocation.address2,
            city: selectedLocation.city || 'Addis Ababa',
            region: selectedLocation.region || 'Addis Ababa',
            postal_code: selectedLocation.postal_code,
            country_code: selectedLocation.country_code,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            contact_name: formData.pickupContactName,
            contact_phone: formData.pickupContactPhone,
            instructions: formData.instructions || undefined,
          },
          items: validItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
          })),
        }),
      });

      if (response.ok) {
        toast.success('Order created', { description: 'Your order has been created successfully. The recipient will receive a confirmation email.' });
        
        // Reset form
        setFormData({
          recipientEmail: '',
          description: '',
          price: '',
          selectedLocationId: '',
          pickupContactName: '',
          pickupContactPhone: '',
          instructions: '',
        });
        setItems([{ id: '1', name: '', quantity: 1 }]);
        
        setOpen(false);
        onOrderCreated?.();
      } else {
        const errorData = await response.json();
        toast.error('Failed to create order', { 
          description: errorData.message || 'Something went wrong' 
        });
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Network error', { description: 'Unable to connect to the server' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#E4FF2C] text-[#0a0a0a] hover:bg-[#E4FF2C]/90 font-medium">
          <Plus className="w-4 h-4 mr-2" />
          Create New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-[#E4FF2C]" />
            Create New Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          {/* Recipient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-[#E4FF2C]" />
              Recipient Information
            </h3>
            <div className="space-y-2">
              <Label htmlFor="recipientEmail" className="text-white">
                Recipient Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="customer@example.com"
                value={formData.recipientEmail}
                onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                required
                className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
              />
              <p className="text-white/40 text-xs">
                The recipient will receive a confirmation email to set their delivery address
              </p>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#E4FF2C]" />
                Items
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={`Item ${index + 1} name`}
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pickup Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#E4FF2C]" />
              Pickup Information
            </h3>
            <div className="space-y-2">
              <Label htmlFor="pickupLocation" className="text-white">
                Pickup Location <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formData.selectedLocationId}
                onValueChange={(value) => setFormData({ ...formData, selectedLocationId: value })}
                disabled={loadingLocations}
              >
                <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectValue placeholder={loadingLocations ? "Loading locations..." : "Select pickup location..."} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 max-h-[300px]">
                  {locations.map((location) => (
                    <SelectItem
                      key={location.id}
                      value={location.id.toString()}
                      className="text-white hover:bg-white/10"
                    >
                      {location.name}
                      {location.city && ` - ${location.city}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupContactName" className="text-white">
                  Contact Name
                </Label>
                <Input
                  id="pickupContactName"
                  placeholder="e.g., Abebe Kebede"
                  value={formData.pickupContactName}
                  onChange={(e) => setFormData({ ...formData, pickupContactName: e.target.value })}
                  className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupContactPhone" className="text-white">
                  Contact Phone
                </Label>
                <Input
                  id="pickupContactPhone"
                  type="tel"
                  placeholder="e.g., +251 911 234 567"
                  value={formData.pickupContactPhone}
                  onChange={(e) => setFormData({ ...formData, pickupContactPhone: e.target.value })}
                  className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-[#E4FF2C]" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the delivery..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-white">
                  Pickup Instructions
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="Special instructions for pickup..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-white">
                Price (ETB)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 w-48"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#E4FF2C] text-[#0a0a0a] hover:bg-[#E4FF2C]/90 font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-[#0a0a0a] border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
