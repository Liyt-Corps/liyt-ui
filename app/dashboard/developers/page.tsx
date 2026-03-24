'use client';

import { useMemo, useState } from 'react';
import { Code2, KeyRound, Settings2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAppSelector } from '@/lib/hooks';
import { useAuthCheck } from '@/lib/hooks/useAuthCheck';
import { Button } from '@/components/ui/button';
import { ApiKeysPanel } from './components/ApiKeysPanel';
import { BusinessSettingsPanel } from './components/BusinessSettingsPanel';

type Tab = 'api-keys' | 'business-settings';

type UserRole = string | { name?: string };

function normalizeRoles(roles: UserRole[] | undefined) {
  if (!roles) return [];

  return roles
    .map((role) => {
      if (typeof role === 'string') return role.toLowerCase();
      if (role?.name) return role.name.toLowerCase();
      return '';
    })
    .filter(Boolean);
}

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('api-keys');
  const { user } = useAppSelector((state) => state.auth);

  const { isAuthenticated, isLoading } = useAuthCheck({ requireAuth: true, redirectTo: '/login' });

  const { canView, canManage } = useMemo(() => {
    const roles = normalizeRoles(user?.roles as UserRole[] | undefined);
    const isAdmin = roles.includes('admin');
    const isStaff = roles.includes('staff');

    return {
      canView: isAdmin || isStaff,
      canManage: isAdmin,
    };
  }, [user]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E4FF2C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#141414] via-[#111111] to-[#0b0b0b] p-6 lg:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Code2 className="h-7 w-7 text-[#E4FF2C]" />
                Developers
              </h1>
              <p className="mt-2 text-white/60 max-w-2xl">
                Manage API credentials and default pickup behavior for integration workflows.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
              Access level: {canManage ? 'Admin (manage)' : 'Staff (read-only)'}
            </div>
          </div>

          <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
            <Button
              type="button"
              size="sm"
              className={
                activeTab === 'api-keys'
                  ? 'bg-[#E4FF2C] text-black hover:bg-[#d7ee26]'
                  : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
              }
              onClick={() => setActiveTab('api-keys')}
            >
              <KeyRound className="h-4 w-4" />
              API Keys
            </Button>
            <Button
              type="button"
              size="sm"
              className={
                activeTab === 'business-settings'
                  ? 'bg-[#E4FF2C] text-black hover:bg-[#d7ee26]'
                  : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
              }
              onClick={() => setActiveTab('business-settings')}
            >
              <Settings2 className="h-4 w-4" />
              Business Settings
            </Button>
          </div>
        </div>

        {!canView ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-100">
            Your account does not currently have developer dashboard access. Ask an admin to assign staff or admin role.
          </div>
        ) : (
          <>
            {activeTab === 'api-keys' && <ApiKeysPanel canManage={canManage} />}
            {activeTab === 'business-settings' && <BusinessSettingsPanel canManage={canManage} />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
