import { Head, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Phone,
    Mail,
    MapPin,
    ShoppingBag,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    X,
    CheckCircle2,
    XCircle,
    Users,
} from 'lucide-react';
import { useState, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    loyalty_points: number;
    created_at: string;
    transactions_count?: number;
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface PageProps extends Record<string, unknown> {
    customers: Paginator<Customer>;
    filters: { search: string | null };
    flash?: { success?: string; error?: string };
}

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export default function CustomersIndex() {
    const { customers, filters, flash } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(customers.current_page);

    const searchCustomer = () => {
        router.get('/customers', { search }, { preserveState: true });
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', email: '', phone: '', address: '' });
        setShowForm(true);
    };

    const openEdit = (c: Customer) => {
        setEditing(c);
        setForm({
            name: c.name,
            email: c.email ?? '',
            phone: c.phone ?? '',
            address: c.address ?? '',
        });
        setShowForm(true);
    };

    const save = () => {
        setLoading(true);

        if (editing) {
            router.patch(`/customers/${editing.id}`, form, {
                preserveScroll: true,
                onFinish: () => {
                    setLoading(false);
                    setShowForm(false);
                    setEditing(null);
                },
            });
        } else {
            router.post('/customers', form, {
                preserveScroll: true,
                onFinish: () => {
                    setLoading(false);
                    setShowForm(false);
                },
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteId) {
            return;
        }

        router.delete(`/customers/${deleteId}`, {
            preserveScroll: true,
            onFinish: () => setDeleteId(null),
        });
    };

    return (
        <>
            <Head title="Pelanggan" />
            <div className="min-h-screen space-y-6 bg-neutral-50 p-4 font-sans md:p-8 dark:bg-neutral-950">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Pelanggan
                        </h1>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                            Kelola data pelanggan dan riwayat transaksi.
                        </p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="h-9 gap-2 bg-black px-4 font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black"
                    >
                        <Plus className="size-3.5" /> Tambah Pelanggan
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

                {/* Search */}
                <div className="flex gap-2">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama, email, atau telepon..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && searchCustomer()
                            }
                            className="h-9 pl-9 text-[13px]"
                        />
                    </div>
                    <Button
                        onClick={searchCustomer}
                        variant="secondary"
                        className="h-9 px-3 text-[13px]"
                    >
                        Cari
                    </Button>
                </div>

                {/* Table */}
                <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                    <CardContent className="p-0">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-900">
                                    <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Kontak
                                    </th>
                                    <th className="px-4 py-3 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Transaksi
                                    </th>
                                    <th className="px-4 py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Poin
                                    </th>
                                    <th className="px-4 py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.data.length > 0 ? (
                                    customers.data.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-semibold">
                                                    {c.name}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Sejak{' '}
                                                    {fmtDate(c.created_at)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-0.5 text-[12px] text-muted-foreground">
                                                    {c.email && (
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="size-3" />
                                                            {c.email}
                                                        </div>
                                                    )}
                                                    {c.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="size-3" />
                                                            {c.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-md text-[11px]"
                                                >
                                                    {c.transactions_count ?? 0}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold">
                                                {c.loyalty_points.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() =>
                                                            openEdit(c)
                                                        }
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-red-500 hover:text-red-700"
                                                        onClick={() =>
                                                            setDeleteId(c.id)
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="h-40 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="size-8 text-neutral-300" />
                                                <p className="text-sm">
                                                    Belum ada pelanggan.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {customers.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">
                            {customers.total} pelanggan
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        '/customers',
                                        { page: 1, search },
                                        { preserveState: true },
                                    )
                                }
                                disabled={customers.current_page === 1}
                            >
                                <ChevronsLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        '/customers',
                                        {
                                            page: customers.current_page - 1,
                                            search,
                                        },
                                        { preserveState: true },
                                    )
                                }
                                disabled={customers.current_page === 1}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="min-w-[80px] text-center text-[13px] text-muted-foreground">
                                {customers.current_page} / {customers.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        '/customers',
                                        {
                                            page: customers.current_page + 1,
                                            search,
                                        },
                                        { preserveState: true },
                                    )
                                }
                                disabled={
                                    customers.current_page ===
                                    customers.last_page
                                }
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        '/customers',
                                        { page: customers.last_page, search },
                                        { preserveState: true },
                                    )
                                }
                                disabled={
                                    customers.current_page ===
                                    customers.last_page
                                }
                            >
                                <ChevronsRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Dialog
                open={showForm}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowForm(false);
                        setEditing(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                Nama *
                            </Label>
                            <Input
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                placeholder="Nama pelanggan"
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                Email
                            </Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                placeholder="email@example.com"
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                Telepon
                            </Label>
                            <Input
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                                placeholder="08xxxx"
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                Alamat
                            </Label>
                            <Textarea
                                value={form.address}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        address: e.target.value,
                                    })
                                }
                                placeholder="Alamat lengkap"
                                className="min-h-[80px]"
                            />
                        </div>
                        <DialogFooter>
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
                                disabled={loading || !form.name}
                                className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black"
                            >
                                {loading
                                    ? 'Menyimpan...'
                                    : editing
                                      ? 'Simpan'
                                      : 'Tambah'}
                            </Button>
                        </DialogFooter>
                    </div>
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
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Pelanggan</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Apakah Anda yakin ingin menghapus pelanggan ini?
                        Tindakan ini dapat dikembalikan (soft delete).
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
