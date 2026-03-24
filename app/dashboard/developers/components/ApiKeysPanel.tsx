'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Copy, KeyRound, RefreshCcw, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import {
  useCreateApiKeyMutation,
  useGetApiKeysQuery,
  useRevokeApiKeyMutation,
  useRotateApiKeyMutation,
  type ApiKey,
} from '@/lib/features/api/apiSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    return 'You do not have permission to perform this action.';
  }

  if (typed?.status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  return fallback;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function keyStatus(key: ApiKey) {
  if (key.revoked_at) return 'Revoked';
  if (key.expires_at && new Date(key.expires_at).getTime() < Date.now()) return 'Expired';
  return 'Active';
}

interface ApiKeysPanelProps {
  canManage: boolean;
}

export function ApiKeysPanel({ canManage }: ApiKeysPanelProps) {
  const { data: keys = [], isLoading, isFetching } = useGetApiKeysQuery();
  const [createApiKey, { isLoading: isCreating }] = useCreateApiKeyMutation();
  const [revokeApiKey, { isLoading: isRevoking }] = useRevokeApiKeyMutation();
  const [rotateApiKey, { isLoading: isRotating }] = useRotateApiKeyMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRotateOpen, setIsRotateOpen] = useState(false);
  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [latestPlaintextKey, setLatestPlaintextKey] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    scopes: 'deliveries:write',
    expires_at: '',
  });

  const [rotateForm, setRotateForm] = useState({
    name: '',
    scopes: 'deliveries:write',
    expires_at: '',
  });

  const sortedKeys = useMemo(
    () => [...keys].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [keys]
  );

  const handleCopy = async () => {
    if (!latestPlaintextKey) return;

    try {
      await navigator.clipboard.writeText(latestPlaintextKey);
      toast.success('API key copied', { description: 'Store it securely. You will not see it again.' });
    } catch {
      toast.error('Copy failed', { description: 'Please copy the key manually before closing.' });
    }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('Missing name', { description: 'API key name is required.' });
      return;
    }

    const scopes = createForm.scopes
      .split(',')
      .map((scope) => scope.trim())
      .filter(Boolean);

    try {
      const response = await createApiKey({
        name: createForm.name.trim(),
        scopes: scopes.length > 0 ? scopes : ['deliveries:write'],
        expires_at: createForm.expires_at || undefined,
      }).unwrap();

      setIsCreateOpen(false);
      setCreateForm({ name: '', scopes: 'deliveries:write', expires_at: '' });

      if (response.plaintext_key) {
        setLatestPlaintextKey(response.plaintext_key);
        setIsSecretOpen(true);
      }

      toast.success('API key created');
    } catch (error) {
      toast.error('Unable to create API key', {
        description: parseErrorMessage(error, 'Please verify your inputs and try again.'),
      });
    }
  };

  const handleRevoke = async (key: ApiKey) => {
    if (key.revoked_at) {
      toast.message('Already revoked', { description: 'This key is already revoked.' });
      return;
    }

    if (!window.confirm(`Revoke API key \"${key.name}\"?`)) {
      return;
    }

    try {
      await revokeApiKey(key.id).unwrap();
      toast.success('API key revoked');
    } catch (error) {
      toast.error('Unable to revoke API key', {
        description: parseErrorMessage(error, 'Please try again.'),
      });
    }
  };

  const openRotateDialog = (key: ApiKey) => {
    setSelectedKey(key);
    setRotateForm({
      name: key.name,
      scopes: key.scopes.join(', '),
      expires_at: key.expires_at ? key.expires_at.slice(0, 16) : '',
    });
    setIsRotateOpen(true);
  };

  const handleRotate = async () => {
    if (!selectedKey) return;

    const scopes = rotateForm.scopes
      .split(',')
      .map((scope) => scope.trim())
      .filter(Boolean);

    try {
      const response = await rotateApiKey({
        id: selectedKey.id,
        name: rotateForm.name.trim() || undefined,
        scopes: scopes.length > 0 ? scopes : undefined,
        expires_at: rotateForm.expires_at || null,
      }).unwrap();

      setIsRotateOpen(false);
      setSelectedKey(null);

      if (response.plaintext_key) {
        setLatestPlaintextKey(response.plaintext_key);
        setIsSecretOpen(true);
      }

      toast.success('API key rotated');
    } catch (error) {
      toast.error('Unable to rotate API key', {
        description: parseErrorMessage(error, 'Please try again.'),
      });
    }
  };

  return (
    <Card className="bg-[#141414] border-white/10">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#E4FF2C]" />
            API Keys
          </CardTitle>
          <CardDescription className="text-white/60 mt-1">
            Create and rotate integration keys for delivery APIs.
          </CardDescription>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          disabled={!canManage}
          className="bg-[#E4FF2C] text-black hover:bg-[#d7ee26]"
        >
          Create API Key
        </Button>
      </CardHeader>
      <CardContent>
        {!canManage && (
          <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            You have read-only access. Only admins can create, rotate, or revoke keys.
          </div>
        )}

        {isLoading || isFetching ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 border-2 border-[#E4FF2C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedKeys.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/20 p-8 text-center text-white/60">
            No API keys yet. Create your first key to start integrating.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/70">Name</TableHead>
                <TableHead className="text-white/70">Prefix</TableHead>
                <TableHead className="text-white/70">Scopes</TableHead>
                <TableHead className="text-white/70">Status</TableHead>
                <TableHead className="text-white/70">Expires</TableHead>
                <TableHead className="text-right text-white/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedKeys.map((key) => {
                const status = keyStatus(key);
                return (
                  <TableRow key={key.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white font-medium">{key.name}</TableCell>
                    <TableCell className="text-white/70">{key.prefix}</TableCell>
                    <TableCell className="text-white/70">
                      <div className="flex flex-wrap gap-2">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="border-white/20 text-white/80">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
                            : status === 'Expired'
                            ? 'bg-amber-500/20 text-amber-200 border-amber-500/30'
                            : 'bg-red-500/20 text-red-200 border-red-500/30'
                        }
                      >
                        {status === 'Active' ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <ShieldAlert className="h-3 w-3" />
                        )}
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/70">{formatDate(key.expires_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-transparent text-white hover:bg-white/10"
                          onClick={() => openRotateDialog(key)}
                          disabled={!canManage || Boolean(key.revoked_at) || isRotating}
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Rotate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(key)}
                          disabled={!canManage || Boolean(key.revoked_at) || isRevoking}
                        >
                          <Trash2 className="h-4 w-4" />
                          Revoke
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-[#101010] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription className="text-white/60">
              The secret key is shown once after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Key name</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Production Integrations"
                className="border-white/20 bg-white/5 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-scopes">Scopes (comma separated)</Label>
              <Input
                id="create-scopes"
                value={createForm.scopes}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, scopes: event.target.value }))}
                placeholder="deliveries:write"
                className="border-white/20 bg-white/5 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-expires">Expires At (optional)</Label>
              <Input
                id="create-expires"
                type="datetime-local"
                value={createForm.expires_at}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, expires_at: event.target.value }))}
                className="border-white/20 bg-white/5 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#E4FF2C] text-black hover:bg-[#d7ee26]"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRotateOpen} onOpenChange={setIsRotateOpen}>
        <DialogContent className="bg-[#101010] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Rotate API Key</DialogTitle>
            <DialogDescription className="text-white/60">
              Rotating revokes the current key and creates a replacement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rotate-name">Key name</Label>
              <Input
                id="rotate-name"
                value={rotateForm.name}
                onChange={(event) => setRotateForm((prev) => ({ ...prev, name: event.target.value }))}
                className="border-white/20 bg-white/5 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rotate-scopes">Scopes (comma separated)</Label>
              <Input
                id="rotate-scopes"
                value={rotateForm.scopes}
                onChange={(event) => setRotateForm((prev) => ({ ...prev, scopes: event.target.value }))}
                className="border-white/20 bg-white/5 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rotate-expires">Expires At (optional)</Label>
              <Input
                id="rotate-expires"
                type="datetime-local"
                value={rotateForm.expires_at}
                onChange={(event) => setRotateForm((prev) => ({ ...prev, expires_at: event.target.value }))}
                className="border-white/20 bg-white/5 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => setIsRotateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#E4FF2C] text-black hover:bg-[#d7ee26]"
              onClick={handleRotate}
              disabled={isRotating}
            >
              {isRotating ? 'Rotating...' : 'Rotate key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSecretOpen} onOpenChange={setIsSecretOpen}>
        <DialogContent className="bg-[#101010] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Your API Key</DialogTitle>
            <DialogDescription className="text-white/60">
              This secret is shown once. Copy and store it securely now.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-white/20 bg-black/40 p-3 font-mono text-sm break-all text-[#E4FF2C]">
            {latestPlaintextKey}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button
              className="bg-[#E4FF2C] text-black hover:bg-[#d7ee26]"
              onClick={() => {
                setIsSecretOpen(false);
                setLatestPlaintextKey(null);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
