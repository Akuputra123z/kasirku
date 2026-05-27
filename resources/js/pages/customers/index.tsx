'use client';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Phone,
    Mail,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    X,
    Users,
    Settings2,
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import customers from '@/routes/customers';

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
    pointConfig?: {
        points_per_currency: number;
        point_value: number;
        min_redeem_points: number;
    };
}

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export default function CustomersIndex() {
    const {
        customers: data,
        filters,
        pointConfig,
    } = usePage<PageProps>().props;

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
    const [showPointConfig, setShowPointConfig] = useState(false);
    const [pointForm, setPointForm] = useState({
        points_per_currency:
            pointConfig?.points_per_currency?.toString() ?? '10000',
        point_value: pointConfig?.point_value?.toString() ?? '100',
        min_redeem_points: pointConfig?.min_redeem_points?.toString() ?? '100',
    });
    const [savingPoints, setSavingPoints] = useState(false);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedSearch = useCallback((value: string) => {
        setSearch(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            router.get(
                customers.index().url,
                { search: value || null, page: 1 },
                { preserveState: true },
            );
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
            router.patch(customers.update({ customer: editing.id }).url, form, {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Pelanggan berhasil diperbarui.'),
                onFinish: () => {
                    setLoading(false);
                    setShowForm(false);
                    setEditing(null);
                },
            });
        } else {
            router.post(customers.store().url, form, {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Pelanggan berhasil ditambahkan.'),
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

        router.delete(customers.destroy({ customer: deleteId }).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Pelanggan berhasil dihapus.'),
            onFinish: () => setDeleteId(null),
        });
    };

    const savePointConfig = () => {
        setSavingPoints(true);
        router.post(
            customers.pointConfig().url,
            {
                points_per_currency:
                    parseInt(pointForm.points_per_currency) || 10000,
                point_value: parseInt(pointForm.point_value) || 100,
                min_redeem_points: parseInt(pointForm.min_redeem_points) || 100,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowPointConfig(false);
                    toast.success('Konfigurasi poin berhasil diperbarui');
                },
                onError: () => toast.error('Gagal menyimpan konfigurasi poin'),
                onFinish: () => setSavingPoints(false),
            },
        );
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

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama, email, atau telepon..."
                        value={search}
                        onChange={(e) => debouncedSearch(e.target.value)}
                        className="h-9 w-full pr-8 pl-9 text-[13px]"
                    />
                    {search && (
                        <button
                            onClick={() => debouncedSearch('')}
                            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Point Config */}
                <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 className="size-4 text-muted-foreground" />
                                <span className="text-[13px] font-semibold text-foreground">
                                    Konfigurasi Poin
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setShowPointConfig(!showPointConfig)
                                }
                                className="h-8 text-[12px]"
                            >
                                {showPointConfig ? 'Tutup' : 'Ubah'}
                            </Button>
                        </div>
                        <div className="mt-2 flex gap-4 text-[12px] text-muted-foreground">
                            <span>
                                1 poin per Rp
                                {Number(
                                    pointForm.points_per_currency,
                                ).toLocaleString('id-ID')}
                            </span>
                            <span>•</span>
                            <span>
                                1 poin = Rp
                                {Number(pointForm.point_value).toLocaleString(
                                    'id-ID',
                                )}
                            </span>
                            <span>•</span>
                            <span>
                                Min tukar{' '}
                                {Number(
                                    pointForm.min_redeem_points,
                                ).toLocaleString('id-ID')}{' '}
                                poin
                            </span>
                        </div>
                        {showPointConfig && (
                            <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-bold text-muted-foreground">
                                            Poin per Rp
                                        </Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={
                                                pointForm.points_per_currency
                                            }
                                            onChange={(e) =>
                                                setPointForm({
                                                    ...pointForm,
                                                    points_per_currency:
                                                        e.target.value,
                                                })
                                            }
                                            className="h-9 text-[13px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-bold text-muted-foreground">
                                            Nilai 1 Poin (Rp)
                                        </Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={pointForm.point_value}
                                            onChange={(e) =>
                                                setPointForm({
                                                    ...pointForm,
                                                    point_value: e.target.value,
                                                })
                                            }
                                            className="h-9 text-[13px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-bold text-muted-foreground">
                                            Minimal Tukar
                                        </Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={pointForm.min_redeem_points}
                                            onChange={(e) =>
                                                setPointForm({
                                                    ...pointForm,
                                                    min_redeem_points:
                                                        e.target.value,
                                                })
                                            }
                                            className="h-9 text-[13px]"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setShowPointConfig(false)
                                        }
                                        className="h-8 text-[12px]"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={savePointConfig}
                                        disabled={savingPoints}
                                        className="h-8 bg-black text-[12px] text-white hover:bg-black/90 dark:bg-white dark:text-black"
                                    >
                                        {savingPoints
                                            ? 'Menyimpan...'
                                            : 'Simpan'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-900">
                                        <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                            Nama
                                        </TableHead>
                                        <TableHead className="py-3 text-[13px] font-semibold text-foreground">
                                            Kontak
                                        </TableHead>
                                        <TableHead className="py-3 text-center text-[13px] font-semibold text-foreground">
                                            Transaksi
                                        </TableHead>
                                        <TableHead className="py-3 text-right text-[13px] font-semibold text-foreground">
                                            Poin
                                        </TableHead>
                                        <TableHead className="py-3 pr-6 text-right text-[13px] font-semibold text-foreground">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.length > 0 ? (
                                        data.data.map((c) => (
                                            <TableRow
                                                key={c.id}
                                                className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                            >
                                                <TableCell className="py-3">
                                                    <p className="font-semibold">
                                                        {c.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Sejak{' '}
                                                        {fmtDate(c.created_at)}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="py-3">
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
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-md text-[11px]"
                                                    >
                                                        {c.transactions_count ??
                                                            0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3 text-right font-bold">
                                                    {c.loyalty_points.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="py-3 pr-6 text-right">
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
                                                                setDeleteId(
                                                                    c.id,
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
                                                colSpan={5}
                                                className="h-40 text-center text-muted-foreground"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <Users className="size-8 text-neutral-300" />
                                                    <p className="text-sm">
                                                        Belum ada pelanggan.
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

                {/* Pagination */}
                {data.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">
                            {data.total} pelanggan
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        customers.index().url,
                                        { page: 1, search },
                                        { preserveState: true },
                                    )
                                }
                                disabled={data.current_page === 1}
                            >
                                <ChevronsLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        customers.index().url,
                                        {
                                            page: data.current_page - 1,
                                            search,
                                        },
                                        { preserveState: true },
                                    )
                                }
                                disabled={data.current_page === 1}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="min-w-[80px] text-center text-[13px] text-muted-foreground">
                                {data.current_page} / {data.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        customers.index().url,
                                        {
                                            page: data.current_page + 1,
                                            search,
                                        },
                                        { preserveState: true },
                                    )
                                }
                                disabled={data.current_page === data.last_page}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        customers.index().url,
                                        { page: data.last_page, search },
                                        { preserveState: true },
                                    )
                                }
                                disabled={data.current_page === data.last_page}
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
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
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
                <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-sm">
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
