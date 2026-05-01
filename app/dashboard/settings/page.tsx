'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, MapPin, Plus, Pencil, Trash2, Bell, Shield, Lock, Mail, Check } from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useAuthCheck } from '@/lib/hooks/useAuthCheck';

// Dynamic import for LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/ui/location-picker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-[#1a1a1a] border border-white/10 rounded-lg flex items-center justify-center">
      <span className="text-white/50">Loading map...</span>
    </div>
  ),
});

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

interface BusinessData {
  id: number;
  name: string;
  slug: string;
  status: string;
  support_email?: string;
}

export default function SettingsPage() {
  const { accessToken, user } = useAppSelector((state) => state.auth);
  
  // Use auth check hook - redirects to login if not authenticated
  const { isAuthenticated, isLoading: authLoading } = useAuthCheck({ requireAuth: true, redirectTo: '/login' });
  
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<BusinessLocation | null>(null);

  const [businessForm, setBusinessForm] = useState({
    name: '',
    supportEmail: '',
    businessEmail: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    country_code: 'ET',
    address1: '',
    address2: '',
    city: '',
    region: 'A.A',
    postal_code: '1000',
    latitude: '',
    longitude: '',
    instructions: '',
    active: true,
  });

  // Load business data from localStorage
  useEffect(() => {
    const businessStr = localStorage.getItem('business');
    if (businessStr) {
      try {
        const businessData: BusinessData = JSON.parse(businessStr);
        setBusinessForm({
          name: businessData.name || '',
          supportEmail: businessData.support_email || '',
          businessEmail: user?.email || '',
        });
      } catch (error) {
        console.error('Failed to parse business data:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/business_locations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setLocations(data);
        } else {
          let errorMessage = 'Failed to load locations';
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch {
            errorMessage = `${errorMessage}: ${response.statusText}`;
          }
          toast.error('Error loading locations', {
            description: errorMessage,
          });
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        toast.error('Network error', {
          description: 'Unable to load your locations. Please check your connection.',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [accessToken]);

  const refreshLocations = async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/business_locations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      } else {
        let errorMessage = 'Failed to refresh locations';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        toast.error('Error refreshing locations', {
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      toast.error('Network error', {
        description: 'Unable to refresh your locations. Please check your connection.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast.error('Authentication required', {
        description: 'Please log in to continue.',
      });
      return;
    }

    const url = editingLocation 
      ? `${API_BASE_URL}/business_locations/${editingLocation.id}`
      : `${API_BASE_URL}/business_locations`;
    
    const method = editingLocation ? 'PATCH' : 'POST';
    const actionText = editingLocation ? 'update' : 'create';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`Location ${actionText}d successfully`, {
          description: `"${formData.name}" has been ${actionText}d and added to your business.`,
        });
        setIsDialogOpen(false);
        setEditingLocation(null);
        resetForm();
        refreshLocations();
      } else {
        // Try to parse error message from backend
        let errorMessage = `Failed to ${actionText} location`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        
        toast.error(`Failed to ${actionText} location`, {
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Failed to save location:', error);
      toast.error('Network error', {
        description: 'Unable to connect to the server. Please check your connection and try again.',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!accessToken) {
      toast.error('Authentication required', {
        description: 'Please log in to continue.',
      });
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/business_locations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast.success('Location deleted successfully', {
          description: 'The location has been removed from your business.',
        });
        refreshLocations();
      } else {
        // Try to parse error message from backend
        let errorMessage = 'Failed to delete location';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        
        toast.error('Failed to delete location', {
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
      toast.error('Network error', {
        description: 'Unable to connect to the server. Please check your connection and try again.',
      });
    }
  };

  const handleEdit = (location: BusinessLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      country_code: location.country_code || 'ET',
      address1: location.address1 || '',
      address2: location.address2 || '',
      city: location.city || '',
      region: location.region || 'A.A',
      postal_code: location.postal_code || '1000',
      latitude: location.latitude || '',
      longitude: location.longitude || '',
      instructions: location.instructions || '',
      active: location.active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      country_code: 'ET',
      address1: '',
      address2: '',
      city: '',
      region: 'A.A',
      postal_code: '1000',
      latitude: '',
      longitude: '',
      instructions: '',
      active: true,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-white/50 mt-1">Manage your business and application preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Business Settings */}
          <Card className="bg-[#141414] border-white/10 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E4FF2C]/10 rounded-lg">
                  <Building2 className="w-5 h-5 text-[#E4FF2C]" />
                </div>
                <div>
                  <CardTitle className="text-white">Business Settings</CardTitle>
                  <CardDescription className="text-white/50">
                    Update your business information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-white">Company Name</Label>
                  <Input
                    id="companyName"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                    placeholder="Logistics Co."
                    className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail" className="text-white">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={businessForm.supportEmail}
                    onChange={(e) => setBusinessForm({ ...businessForm, supportEmail: e.target.value })}
                    placeholder="support@company.com"
                    className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessEmail" className="text-white">Business Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessForm.businessEmail}
                    onChange={(e) => setBusinessForm({ ...businessForm, businessEmail: e.target.value })}
                    placeholder="admin@company.com"
                    className="pl-10 bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
              </div>
              <Button className="bg-[#E4FF2C] text-[#0a0a0a] hover:bg-[#E4FF2C]/90 font-medium">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-[#141414] border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E4FF2C]/10 rounded-lg">
                  <Shield className="w-5 h-5 text-[#E4FF2C]" />
                </div>
                <div>
                  <CardTitle className="text-white">Security</CardTitle>
                  <CardDescription className="text-white/50">
                    Manage your security preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-white/50" />
                    <div>
                      <p className="text-white text-sm font-medium">Two-Factor Auth</p>
                      <p className="text-white/50 text-xs">Add extra security</p>
                    </div>
                  </div>
                  <Switch className="data-[state=checked]:bg-[#E4FF2C]" />
                </div>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-white/50" />
                    <div>
                      <p className="text-white text-sm font-medium">Email Notifications</p>
                      <p className="text-white/50 text-xs">Get updates via email</p>
                    </div>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-[#E4FF2C]" />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Business Locations */}
          <Card className="bg-[#141414] border-white/10 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E4FF2C]/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#E4FF2C]" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Business Locations</CardTitle>
                    <CardDescription className="text-white/50">
                      Manage your business locations and warehouses
                    </CardDescription>
                  </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-[#E4FF2C] text-[#0a0a0a] hover:bg-[#E4FF2C]/90 font-medium"
                      onClick={() => {
                        setEditingLocation(null);
                        resetForm();
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#141414] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        {editingLocation ? 'Edit Location' : 'Add New Location'}
                      </DialogTitle>
                      <DialogDescription className="text-white/50">
                        {editingLocation ? 'Update the location details below.' : 'Enter the details for the new business location.'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-white">Location Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Main Warehouse"
                            required
                            className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address1" className="text-white">Address Line 1</Label>
                        <Input
                          id="address1"
                          value={formData.address1}
                          onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                          placeholder="123 Main St"
                          className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address2" className="text-white">Address Line 2</Label>
                        <Input
                          id="address2"
                          value={formData.address2}
                          onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                          placeholder="Suite 100"
                          className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-white">City</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="New York"
                            className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                          />
                        </div>
                        <div className="space-y-2 flex items-center pt-6">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="active"
                              checked={formData.active}
                              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                              className="data-[state=checked]:bg-[#E4FF2C]"
                            />
                            <Label htmlFor="active" className="text-white cursor-pointer">Active</Label>
                          </div>
                        </div>
                      </div>
                      {/* Map Location Picker */}
                      <div className="space-y-2">
                        <Label className="text-white">Location Coordinates</Label>
                        <LocationPicker
                          latitude={formData.latitude}
                          longitude={formData.longitude}
                          onLocationChange={(lat, lng) => {
                            setFormData({ ...formData, latitude: lat, longitude: lng });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instructions" className="text-white">Delivery Instructions</Label>
                        <Input
                          id="instructions"
                          value={formData.instructions}
                          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                          placeholder="Ring doorbell, use side entrance"
                          className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
                        />
                      </div>
                      <DialogFooter className="mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-[#E4FF2C] text-[#0a0a0a] hover:bg-[#E4FF2C]/90 font-medium"
                        >
                          {editingLocation ? 'Update Location' : 'Create Location'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-white/50">Loading locations...</div>
              ) : locations.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-white/30" />
                  <p>No locations added yet.</p>
                  <p className="text-sm mt-1">Add your first business location to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-start justify-between p-4 bg-[#1a1a1a] rounded-lg border border-white/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-[#E4FF2C]/10 rounded-lg mt-1">
                          <MapPin className="w-4 h-4 text-[#E4FF2C]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-medium">{location.name}</h4>
                            {location.active && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#E4FF2C]/20 text-[#E4FF2C]">
                                <Check className="w-3 h-3 mr-1" />
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-white/50 text-sm mt-1">
                            {location.address1 && `${location.address1}, `}
                            {location.city && `${location.city}, `}
                            {location.region && `${location.region} `}
                            {location.postal_code}
                          </p>
                          {location.instructions && (
                            <p className="text-white/30 text-xs mt-1">
                              Instructions: {location.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(location)}
                          className="text-white/50 hover:text-white hover:bg-white/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(location.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
