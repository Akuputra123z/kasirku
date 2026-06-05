'use client';
import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    XCircle,
    Plus,
    Pencil,
    Trash2,
    Shield,
    Search,
    X,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import rolesRoute from '@/routes/roles';

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

interface PageProps extends Record<string, unknown> {
    roles: Role[];
    permissions: string[];
    flash?: { success?: string; error?: string };
}

const permissionLabels: Record<string, string> = {
    'view-dashboard': 'Dasbor',
    'manage-products': 'Kelola Produk',
    'manage-categories': 'Kelola Kategori',
    'manage-payment-methods': 'Kelola Pembayaran',
    'manage-pos': 'Point of Sale',
    'view-history': 'Riwayat Transaksi',
    'manage-shifts': 'Kelola Shift',
    'view-reports': 'Lihat Laporan',
    'export-reports': 'Ekspor Laporan',
    'view-chat': 'Chat AI',
    'manage-settings': 'Pengaturan',
    'manage-users': 'Kelola Pengguna',
    'manage-vouchers': 'Kelola Voucher',
};

const permissionGroups: Record<string, string[]> = {
    Dasbor: ['view-dashboard'],
    'Data Master': [
        'manage-products',
        'manage-categories',
        'manage-payment-methods',
    ],
    Transaksi: ['manage-pos', 'view-history', 'manage-shifts'],
    Laporan: ['view-reports', 'export-reports'],
    Alat: ['view-chat'],
    Pengaturan: ['manage-settings', 'manage-users'],
    Promo: ['manage-vouchers'],
};

const roleLabels: Record<string, string> = {
    admin: 'Admin',
    supervisor: 'Supervisor',
    kasir: 'Kasir',
};

export default function RolesIndex() {
    const { roles, permissions } = usePage<PageProps>().props;

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [formName, setFormName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        [],
    );
    const [saving, setSaving] = useState(false);

    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedSearch = useCallback((value: string) => {
        setSearchInput(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery(value);
        }, 300);
    }, []);

    useEffect(
        () => () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        },
        [],
    );

    const filteredRoles = useMemo(() => {
        if (!searchQuery) {
            return roles;
        }

        const q = searchQuery.toLowerCase();

        return roles.filter((role) => {
            const label = roleLabels[role.name] ?? role.name;

            return label.toLowerCase().includes(q);
        });
    }, [roles, searchQuery]);

    const openCreate = () => {
        setEditing(null);
        setFormName('');
        setSelectedPermissions([]);
        setShowForm(true);
    };

    const openEdit = (role: Role) => {
        setEditing(role);
        setFormName(role.name);
        setSelectedPermissions([...role.permissions]);
        setShowForm(true);
    };

    const togglePermission = (perm: string) => {
        setSelectedPermissions((prev) =>
            prev.includes(perm)
                ? prev.filter((p) => p !== perm)
                : [...prev, perm],
        );
    };

    const selectAll = () => setSelectedPermissions([...permissions]);
    const deselectAll = () => setSelectedPermissions([]);

    const save = () => {
        if (!formName.trim()) {
            return;
        }

        setSaving(true);

        if (editing) {
            router.patch(
                rolesRoute.update(editing.id).url,
                { name: formName, permissions: selectedPermissions },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Role berhasil diperbarui');
                    },
                    onError: () => {
                        toast.error('Gagal memperbarui role');
                    },
                    onFinish: () => {
                        setSaving(false);
                        setShowForm(false);
                        setEditing(null);
                    },
                },
            );
        } else {
            router.post(
                rolesRoute.store().url,
                { name: formName, permissions: selectedPermissions },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Role berhasil dibuat');
                    },
                    onError: () => {
                        toast.error('Gagal membuat role');
                    },
                    onFinish: () => {
                        setSaving(false);
                        setShowForm(false);
                    },
                },
            );
        }
    };

    const confirmDelete = () => {
        if (!deleteId) {
            return;
        }

        router.delete(rolesRoute.destroy(deleteId).url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Role berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus role');
            },
            onFinish: () => setDeleteId(null),
        });
    };

    return (
        <>
            <Head title="Role & Hak Akses" />
            <div className="min-h-screen space-y-6 bg-neutral-50 p-4 md:p-8 dark:bg-neutral-950">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Role & Hak Akses
                        </h1>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                            Kelola role dan hak akses pengguna toko.
                        </p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="h-9 gap-2 bg-black px-4 font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black"
                    >
                        <Plus className="size-3.5" /> Tambah Role
                    </Button>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari role..."
                        value={searchInput}
                        onChange={(e) => debouncedSearch(e.target.value)}
                        className="h-9 pr-8 pl-9 text-[13px]"
                    />
                    {searchInput && (
                        <button
                            onClick={() => debouncedSearch('')}
                            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Roles Table */}
                <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                    <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="size-5" />
                            Daftar Role
                        </CardTitle>
                        <CardDescription>
                            {filteredRoles.length} role terdaftar
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-900">
                                        <TableHead className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Role
                                        </TableHead>
                                        <TableHead className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Hak Akses
                                        </TableHead>
                                        <TableHead className="w-28 text-right text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRoles.length > 0 ? (
                                        filteredRoles.map((role) => (
                                            <TableRow
                                                key={role.id}
                                                className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                            >
                                                <TableCell className="py-3 font-semibold capitalize">
                                                    {roleLabels[role.name] ??
                                                        role.name}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {role.permissions
                                                            .length > 0 ? (
                                                            role.permissions.map(
                                                                (p) => (
                                                                    <Badge
                                                                        key={p}
                                                                        variant="secondary"
                                                                        className="rounded-md text-[11px]"
                                                                    >
                                                                        {permissionLabels[
                                                                            p
                                                                        ] ?? p}
                                                                    </Badge>
                                                                ),
                                                            )
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                Tidak ada izin
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() =>
                                                                openEdit(role)
                                                            }
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-red-500 hover:text-red-700"
                                                            onClick={() =>
                                                                setDeleteId(
                                                                    role.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                className="h-52 text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <Shield className="size-10 text-neutral-300 dark:text-neutral-700" />
                                                    <p className="text-sm text-muted-foreground">
                                                        {searchInput
                                                            ? 'Tidak ada role yang cocok dengan pencarian.'
                                                            : 'Belum ada role. Tambah role baru untuk memulai.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog
                open={showForm}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowForm(false);
                        setEditing(null);
                    }
                }}
            >
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit Role' : 'Tambah Role'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Role name */}
                        <div className="space-y-2">
                            <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                Nama Role *
                            </Label>
                            <Input
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="contoh: supervisor"
                                className="h-10 lowercase"
                            />
                        </div>

                        {/* Permissions */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                                <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Hak Akses
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    {selectedPermissions.length} /{' '}
                                    {permissions.length} dipilih
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={selectAll}
                                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    Pilih Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={deselectAll}
                                    className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
                                >
                                    Hapus Semua
                                </button>
                            </div>

                            {Object.entries(permissionGroups).map(
                                ([group, perms]) => (
                                    <div key={group}>
                                        <h4 className="mb-2 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                            {group}
                                        </h4>
                                        <div className="space-y-1">
                                            {perms
                                                .filter((p) =>
                                                    permissions.includes(p),
                                                )
                                                .map((perm) => (
                                                    <label
                                                        key={perm}
                                                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition hover:bg-muted/50"
                                                    >
                                                        <Checkbox
                                                            checked={selectedPermissions.includes(
                                                                perm,
                                                            )}
                                                            onCheckedChange={() =>
                                                                togglePermission(
                                                                    perm,
                                                                )
                                                            }
                                                        />
                                                        <span className="text-sm">
                                                            {permissionLabels[
                                                                perm
                                                            ] ?? perm}
                                                        </span>
                                                    </label>
                                                ))}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowForm(false);
                                setEditing(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={save}
                            disabled={saving || !formName.trim()}
                            className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black"
                        >
                            {saving
                                ? 'Menyimpan...'
                                : editing
                                  ? 'Simpan'
                                  : 'Tambah'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog
                open={deleteId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteId(null);
                    }
                }}
            >
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Role</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Apakah Anda yakin ingin menghapus role ini? Pengguna
                        dengan role ini akan kehilangan aksesnya.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
