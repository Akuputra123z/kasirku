import { Head, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    XCircle,
    Plus,
    Pencil,
    Trash2,
    Shield,
} from 'lucide-react';
import { useState } from 'react';
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
    'view-dashboard': 'Dashboard',
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
    Dashboard: ['view-dashboard'],
    'Master Data': [
        'manage-products',
        'manage-categories',
        'manage-payment-methods',
    ],
    Transactions: ['manage-pos', 'view-history', 'manage-shifts'],
    Reports: ['view-reports', 'export-reports'],
    Tools: ['view-chat'],
    Settings: ['manage-settings', 'manage-users'],
    Promo: ['manage-vouchers'],
};

const roleLabels: Record<string, string> = {
    admin: 'Admin',
    supervisor: 'Supervisor',
    kasir: 'Kasir',
};

export default function RolesIndex() {
    const { roles, permissions, flash } = usePage<PageProps>().props;

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [formName, setFormName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        [],
    );
    const [saving, setSaving] = useState(false);

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
        if (!formName.trim()) return;
        setSaving(true);

        if (editing) {
            router.patch(
                `/roles/${editing.id}`,
                { name: formName, permissions: selectedPermissions },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setSaving(false);
                        setShowForm(false);
                        setEditing(null);
                    },
                },
            );
        } else {
            router.post(
                '/roles',
                { name: formName, permissions: selectedPermissions },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setSaving(false);
                        setShowForm(false);
                    },
                },
            );
        }
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(`/roles/${deleteId}`, {
            preserveScroll: true,
            onFinish: () => setDeleteId(null),
        });
    };

    return (
        <>
            <Head title="Roles & Permissions" />
            <div className="min-h-screen space-y-6 bg-neutral-50 p-4 md:p-8 dark:bg-neutral-950">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Roles & Permissions
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

                {/* Flash */}
                <AnimatePresence>
                    {flash?.success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50"
                        >
                            <CheckCircle2 className="size-5 shrink-0" />
                            <span className="text-sm font-medium">
                                {flash.success}
                            </span>
                        </motion.div>
                    )}
                    {flash?.error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-950/50"
                        >
                            <XCircle className="size-5 shrink-0" />
                            <span className="text-sm font-medium">
                                {flash.error}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Roles Table */}
                <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                    <CardHeader className="border-b border-neutral-100 dark:border-neutral-800">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="size-5" />
                            Daftar Role
                        </CardTitle>
                        <CardDescription>
                            {roles.length} role terdaftar
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-900">
                                    <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Permissions
                                    </th>
                                    <th className="w-28 px-4 py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map((role) => (
                                    <tr
                                        key={role.id}
                                        className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                    >
                                        <td className="px-4 py-3 font-semibold capitalize">
                                            {roleLabels[role.name] ?? role.name}
                                        </td>
                                        <td className="flex flex-wrap gap-1 px-4 py-3">
                                            {role.permissions.length > 0 ? (
                                                role.permissions.map((p) => (
                                                    <Badge
                                                        key={p}
                                                        variant="secondary"
                                                        className="rounded-md text-[11px]"
                                                    >
                                                        {permissionLabels[p] ??
                                                            p}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    Tidak ada permissions
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
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
                                                        setDeleteId(role.id)
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
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
                                    Permissions
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
                    if (!open) setDeleteId(null);
                }}
            >
                <DialogContent className="sm:max-w-sm">
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
