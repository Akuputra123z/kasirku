'use client';

import { Head, router, useForm } from '@inertiajs/react';
import {
    ExternalLink,
    Pencil,
    RotateCcw,
    Search,
    Store,
    ToggleLeft,
    ToggleRight,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { home } from '@/routes';

type TenantRow = {
    id: number;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    subscription_status: string;
    created_at: string;
    domains: { domain: string }[];
};

export default function AdminTenants({
    tenants,
    filters = {},
}: {
    tenants: { data: TenantRow[] };
    filters?: { search?: string; status?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [editTenant, setEditTenant] = useState<TenantRow | null>(null);

    const { data, setData, patch, processing, errors } = useForm({
        name: '',
        address: '',
        phone: '',
    });

    const openEdit = (tenant: TenantRow) => {
        setEditTenant(tenant);
        setData({
            name: tenant.name,
            address: tenant.address ?? '',
            phone: tenant.phone ?? '',
        });
    };

    const saveEdit = () => {
        if (!editTenant) {
            return;
        }

        patch(`/admin/tenants/${editTenant.id}`, {
            preserveState: true,
            onSuccess: () => setEditTenant(null),
        });
    };

    const toggleStatus = (tenant: TenantRow) => {
        const isSuspending = tenant.subscription_status === 'active';

        if (
            isSuspending &&
            !window.confirm(
                `Suspend "${tenant.name}"? Users will lose access until reactivated.`,
            )
        ) {
            return;
        }

        router.post(
            `/admin/tenants/${tenant.id}/toggle-status`,
            {},
            { preserveState: true },
        );
    };

    const resetTenant = (tenant: TenantRow) => {
        if (
            !window.confirm(
                `Reset database for "${tenant.name}"? All tenant data will be wiped and reseeded. This cannot be undone.`,
            )
        ) {
            return;
        }

        router.post(
            `/admin/tenants/${tenant.id}/reset`,
            {},
            { preserveState: true },
        );
    };

    const applyFilters = () => {
        const params: Record<string, string> = {};

        if (search) {
            params.search = search;
        }

        if (statusFilter !== 'all') {
            params.status = statusFilter;
        }

        router.get('/admin/tenants', params, {
            preserveState: true,
            replace: true,
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === tenants.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(tenants.data.map((t) => t.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const bulkAction = (action: 'activate' | 'suspend' | 'delete') => {
        if (selectedIds.length === 0) {
            return;
        }

        const label =
            action === 'suspend'
                ? 'suspend'
                : action === 'delete'
                  ? 'delete'
                  : 'activate';

        if (
            !window.confirm(
                `${label.charAt(0).toUpperCase() + label.slice(1)} ${selectedIds.length} selected store(s)?`,
            )
        ) {
            return;
        }

        router.post(
            '/admin/tenants/bulk-action',
            { ids: selectedIds, action },
            {
                preserveState: true,
                onSuccess: () => setSelectedIds([]),
            },
        );
    };

    return (
        <>
            <Head title="Admin - Tenants" />
            <div className="px-4 py-6">
                <Heading
                    title="Store Management"
                    description="View and manage all registered stores"
                />
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            All Stores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama atau slug..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                />
                            </div>
                            <Select
                                value={statusFilter}
                                onValueChange={(v) => {
                                    setStatusFilter(v);
                                    const params: Record<string, string> = {};

                                    if (search) {
                                        params.search = search;
                                    }

                                    if (v !== 'all') {
                                        params.status = v;
                                    }

                                    router.get('/admin/tenants', params, {
                                        preserveState: true,
                                        replace: true,
                                    });
                                }}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Semua status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua status
                                    </SelectItem>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="suspended">
                                        Suspended
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={applyFilters}
                            >
                                Cari
                            </Button>
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                                <span className="text-sm text-muted-foreground">
                                    {selectedIds.length} selected:
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => bulkAction('activate')}
                                >
                                    <ToggleLeft className="mr-1 h-3.5 w-3.5" />
                                    Activate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => bulkAction('suspend')}
                                >
                                    <ToggleRight className="mr-1 h-3.5 w-3.5" />
                                    Suspend
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => bulkAction('delete')}
                                >
                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </div>
                        )}

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={
                                                selectedIds.length ===
                                                    tenants.data.length &&
                                                tenants.data.length > 0
                                            }
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Store Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead className="w-56" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenants.data.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(
                                                    tenant.id,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleSelect(tenant.id)
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {tenant.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {tenant.slug}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    tenant.subscription_status ===
                                                    'active'
                                                        ? 'default'
                                                        : 'destructive'
                                                }
                                            >
                                                {tenant.subscription_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(
                                                tenant.created_at,
                                            ).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <a
                                                        href={`/admin/enter-store/${tenant.slug}`}
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        Masuk
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openEdit(tenant)
                                                    }
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant={
                                                        tenant.subscription_status ===
                                                        'active'
                                                            ? 'destructive'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        toggleStatus(tenant)
                                                    }
                                                >
                                                    {tenant.subscription_status ===
                                                    'active' ? (
                                                        <>
                                                            <ToggleRight className="h-3.5 w-3.5" />
                                                            Suspend
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ToggleLeft className="h-3.5 w-3.5" />
                                                            Activate
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        resetTenant(tenant)
                                                    }
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={editTenant !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditTenant(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Store</DialogTitle>
                        <DialogDescription>
                            Update store information for{' '}
                            {editTenant?.name ?? ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Nama Toko</Label>
                            <Input
                                id="edit-name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-address">Alamat</Label>
                            <Input
                                id="edit-address"
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-phone">Telepon</Label>
                            <Input
                                id="edit-phone"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditTenant(null)}
                        >
                            Batal
                        </Button>
                        <Button onClick={saveEdit} disabled={processing}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminTenants.layout = {
    breadcrumbs: [{ title: 'Admin', href: home() }],
};
