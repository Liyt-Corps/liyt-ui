'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Save } from 'lucide-react';
import {
  useGetBusinessSettingsQuery,
  useUpdateBusinessSettingsMutation,
  type BusinessSettings,
} from '@/lib/features/api/apiSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type QueryError = {
  status?: number;
  data?: { error?: string; message?: string } | string;
};

function parseErrorMessage(error: unknown, fallback: string) {
  const typed = error as QueryError;

  if (typeof typed?.data === 'string') {
    return typed.data;
  }

  if (typed?.data && typeof typed.data === 'object') {
    return typed.data.message || typed.data.error || fallback;
  }

  if (typed?.status === 403) {
    return 'You do not have permission to update business settings.';
  }

  if (typed?.status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  return fallback;
}

const EMPTY_SETTINGS: BusinessSettings = {
  pickup_address1: null,
  pickup_address2: null,
  pickup_city: null,
  pickup_region: null,
  pickup_postal_code: null,
  pickup_country_code: null,
  pickup_latitude: null,
  pickup_longitude: null,
  pickup_contact_name: null,
  pickup_contact_phone: null,
  pickup_instructions: null,
};

interface BusinessSettingsPanelProps {
  canManage: boolean;
}

export function BusinessSettingsPanel({ canManage }: BusinessSettingsPanelProps) {
  const { data, isLoading, isFetching } = useGetBusinessSettingsQuery();
  const [updateBusinessSettings, { isLoading: isSaving }] = useUpdateBusinessSettingsMutation();

  const [draft, setDraft] = useState<Partial<BusinessSettings>>({});
  const source = useMemo(() => ({ ...EMPTY_SETTINGS, ...(data || {}) }), [data]);
  const form = useMemo(() => ({ ...source, ...draft }), [source, draft]);

  const isDirty = useMemo(() => {
    const source = data || EMPTY_SETTINGS;

    return (
      form.pickup_address1 !== source.pickup_address1 ||
      form.pickup_address2 !== source.pickup_address2 ||
      form.pickup_city !== source.pickup_city ||
      form.pickup_region !== source.pickup_region ||
      form.pickup_postal_code !== source.pickup_postal_code ||
      form.pickup_country_code !== source.pickup_country_code ||
      form.pickup_latitude !== source.pickup_latitude ||
      form.pickup_longitude !== source.pickup_longitude ||
      form.pickup_contact_name !== source.pickup_contact_name ||
      form.pickup_contact_phone !== source.pickup_contact_phone ||
      form.pickup_instructions !== source.pickup_instructions
    );
  }, [data, form]);

  const setField = (field: keyof BusinessSettings, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value || null }));
  };

  const resetForm = () => {
    setDraft({});
  };

  const saveSettings = async () => {
    const payload = {
      pickup_address1: form.pickup_address1,
      pickup_address2: form.pickup_address2,
      pickup_city: form.pickup_city,
      pickup_region: form.pickup_region,
      pickup_postal_code: form.pickup_postal_code,
      pickup_country_code: form.pickup_country_code,
      pickup_latitude: form.pickup_latitude,
      pickup_longitude: form.pickup_longitude,
      pickup_contact_name: form.pickup_contact_name,
      pickup_contact_phone: form.pickup_contact_phone,
      pickup_instructions: form.pickup_instructions,
    };

    try {
      await updateBusinessSettings(payload).unwrap();
      setDraft({});
      toast.success('Business settings saved');
    } catch (error) {
      toast.error('Unable to save settings', {
        description: parseErrorMessage(error, 'Please review your values and try again.'),
      });
    }
  };

  return (
    <Card className="bg-[#141414] border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#E4FF2C]" />
          Business Settings
        </CardTitle>
        <CardDescription className="text-white/60">
          Configure pickup defaults used when creating deliveries through your integrations.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {!canManage && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            You have read-only access. Only admins can update business settings.
          </div>
        )}

        {isLoading || isFetching ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 border-2 border-[#E4FF2C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pickup-address1" className="text-white/90">Address line 1</Label>
                <Input
                  id="pickup-address1"
                  value={form.pickup_address1 || ''}
                  onChange={(event) => setField('pickup_address1', event.target.value)}
                  disabled={!canManage}
                  className="border-white/20 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-address2" className="text-white/90">Address line 2</Label>
                <Input
                  id="pickup-address2"
                  value={form.pickup_address2 || ''}
                  onChange={(event) => setField('pickup_address2', event.target.value)}
                  disabled={!canManage}
                  className="border-white/20 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-city" className="text-white/90">City</Label>
                <Input
                  id="pickup-city"
                  value={form.pickup_city || ''}
                  onChange={(event) => setField('pickup_city', event.target.value)}
                  disabled={!canManage}
                  className="border-white/20 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-region" className="text-white/90">Region / State</Label>
                <Input
                  id="pickup-region"
                  value={form.pickup_region || ''}
                  onChange={(event) => setField('pickup_region', event.target.value)}
                  disabled={!canManage}
                  className="border-white/20 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-postal" className="text-white/90">Postal code</Label>
                <Input
                  id="pickup-postal"
                  value={form.pickup_postal_code || ''}
                  onChange={(event) => setField('pickup_postal_code', event.target.value)}
                  disabled={!canManage}
                  className="border-white/20 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-country" className="text-white/90">Country code</Label>
                <Input
                  id="pickup-country"
                  value={form.pickup_country_code || ''}
                  onChange={(event) => setField('pickup_country_code', event.target.value)}
                  placeholder="US"
                  disabled={!canManage}
                  className="border-white/20 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-lat" className="text-white/90">Latitude</Label>
                <Input
                  id="pickup-lat"
                  value={form.pickup_latitude || ''}
                  onChange={(event) => setField('pickup_latitude', event.target.value)}
                  disabled={!canManage}
                  className="border-white/20 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-lng" className="text-white/90">Longitude</Label>
                <Input
                  id="pickup-lng"
                  value={form.pickup_longitude || ''}
                  onChange={(event) => setField('pickup_longitude', event.target.value)}
                  disabled={!canManage}
                  className="border-white/20 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-contact-name" className="text-white/90">Pickup contact name</Label>
                <Input
                  id="pickup-contact-name"
                  value={form.pickup_contact_name || ''}
                  onChange={(event) => setField('pickup_contact_name', event.target.value)}
                  disabled={!canManage}
                  className="border-white/20 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-contact-phone" className="text-white/90">Pickup contact phone</Label>
                <Input
                  id="pickup-contact-phone"
                  value={form.pickup_contact_phone || ''}
                  onChange={(event) => setField('pickup_contact_phone', event.target.value)}
                  disabled={!canManage}
                  className="border-white/20 bg-white/5 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup-instructions" className="text-white/90">Pickup instructions</Label>
              <Textarea
                id="pickup-instructions"
                value={form.pickup_instructions || ''}
                onChange={(event) => setField('pickup_instructions', event.target.value)}
                disabled={!canManage}
                className="border-white/20 bg-white/5 text-white"
                rows={4}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-[#E4FF2C] text-black hover:bg-[#d7ee26]"
                onClick={saveSettings}
                disabled={!canManage || !isDirty || isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save settings'}
              </Button>

              <Button
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                disabled={!isDirty || isSaving}
                onClick={resetForm}
              >
                Reset changes
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
