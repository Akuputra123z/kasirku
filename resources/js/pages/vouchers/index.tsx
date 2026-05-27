'use client';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Tag,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    Percent,
    Coins,
    X,
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
import vouchers from '@/routes/vouchers';

interface Voucher {
    id: number;
    code: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount: number;
    max_discount: number | null;
    max_uses: number | null;
    used_count: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
    deleted_at: string | null;
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface PageProps extends Record<string, unknown> {
    vouchers: Paginator<Voucher>;
    filters: { search: string | null };
}

const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(v);
const fmtDate = (s: string | null) =>
    s
        ? new Date(s).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : '—';

export default function VouchersIndex() {
    const { vouchers: data, filters } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Voucher | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState({
        code: '',
        name: '',
        type: 'fixed',
        value: '',
        min_order_amount: '',
        max_discount: '',
        max_uses: '',
        valid_from: '',
        valid_until: '',
        is_active: true,
    });
    const [loading, setLoading] = useState(false);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedSearch = useCallback((value: string) => {
        setSearch(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            router.get(
                vouchers.index().url,
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
        setForm({
            code: '',
            name: '',
            type: 'fixed',
            value: '',
            min_order_amount: '',
            max_discount: '',
            max_uses: '',
            valid_from: '',
            valid_until: '',
            is_active: true,
        });
        setShowForm(true);
    };

    const openEdit = (v: Voucher) => {
        setEditing(v);
        setForm({
            code: v.code,
            name: v.name,
            type: v.type,
            value: String(v.value),
            min_order_amount: String(v.min_order_amount),
            max_discount: v.max_discount ? String(v.max_discount) : '',
            max_uses: v.max_uses ? String(v.max_uses) : '',
            valid_from: v.valid_from ? v.valid_from.slice(0, 16) : '',
            valid_until: v.valid_until ? v.valid_until.slice(0, 16) : '',
            is_active: v.is_active,
        });
        setShowForm(true);
    };

    const save = () => {
        setLoading(true);
        const payload = {
            ...form,
            value: Number(form.value),
            min_order_amount: Number(form.min_order_amount) || 0,
            max_discount: form.max_discount ? Number(form.max_discount) : null,
            max_uses: form.max_uses ? Number(form.max_uses) : null,
            valid_from: form.valid_from || null,
            valid_until: form.valid_until || null,
            is_active: form.is_active,
        };

        if (editing) {
            router.patch(
                vouchers.update({ voucher: editing.id }).url,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        toast.success('Voucher berhasil diperbarui.'),
                    onFinish: () => {
                        setLoading(false);
                        setShowForm(false);
                        setEditing(null);
                    },
                },
            );
        } else {
            router.post(vouchers.store().url, payload, {
                preserveScroll: true,
                onSuccess: () => toast.success('Voucher berhasil ditambahkan.'),
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

        router.delete(vouchers.destroy({ voucher: deleteId }).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Voucher berhasil dihapus.'),
            onFinish: () => setDeleteId(null),
        });
    };

    return (
        <>
            <Head title="Voucher" />
            <div className="min-h-screen space-y-6 bg-neutral-50 p-4 font-sans md:p-8 dark:bg-neutral-950">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Voucher
                        </h1>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                            Kelola kode voucher dan diskon.
                        </p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="h-9 gap-2 bg-black px-4 font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black"
                    >
                        <Plus className="size-3.5" /> Tambah Voucher
                    </Button>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari kode atau nama voucher..."
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

                <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-900">
                                        <TableHead className="px-4 py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Kode
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Nama
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Tipe
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Nilai
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Min Order
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Pemakaian
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Masa Berlaku
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Status
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.length > 0 ? (
                                        data.data.map((v) => {
                                            const isExpired =
                                                v.valid_until &&
                                                new Date(v.valid_until) <
                                                    new Date();

                                            return (
                                                <TableRow
                                                    key={v.id}
                                                    className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                                >
                                                    <TableCell className="px-4 py-3">
                                                        <span className="font-mono font-bold text-[#2d5a4e]">
                                                            {v.code}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 font-semibold">
                                                        {v.name}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        {v.type ===
                                                        'percentage' ? (
                                                            <Badge className="rounded-md border-blue-200 bg-blue-50 text-[11px] text-blue-700 shadow-none dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400">
                                                                <Percent className="mr-1 size-3" />
                                                                Persen
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="rounded-md border-amber-200 bg-amber-50 text-[11px] text-amber-700 shadow-none dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                                                                <Coins className="mr-1 size-3" />
                                                                Nominal
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-right font-bold">
                                                        {v.type === 'percentage'
                                                            ? `${v.value}%`
                                                            : fmt(v.value)}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-right text-muted-foreground">
                                                        {v.min_order_amount > 0
                                                            ? fmt(
                                                                  v.min_order_amount,
                                                              )
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        <span
                                                            className={
                                                                v.max_uses &&
                                                                v.used_count >=
                                                                    v.max_uses
                                                                    ? 'font-bold text-red-600'
                                                                    : ''
                                                            }
                                                        >
                                                            {v.used_count}
                                                            {v.max_uses
                                                                ? `/${v.max_uses}`
                                                                : ''}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        <div className="flex flex-col text-[11px]">
                                                            {v.valid_from ? (
                                                                <span>
                                                                    {fmtDate(
                                                                        v.valid_from,
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    —
                                                                </span>
                                                            )}
                                                            {v.valid_until && (
                                                                <span className="text-muted-foreground">
                                                                    →{' '}
                                                                    {fmtDate(
                                                                        v.valid_until,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        {!v.is_active ? (
                                                            <Badge className="rounded-md border-none bg-neutral-100 text-[11px] text-neutral-500 shadow-none">
                                                                Nonaktif
                                                            </Badge>
                                                        ) : isExpired ? (
                                                            <Badge className="rounded-md border-none bg-red-50 text-[11px] text-red-600 shadow-none">
                                                                Kadaluarsa
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="rounded-md border-none bg-emerald-50 text-[11px] text-emerald-600 shadow-none">
                                                                Aktif
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={() =>
                                                                    openEdit(v)
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
                                                                        v.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="h-40 text-center text-muted-foreground"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <Tag className="size-8 text-neutral-300" />
                                                    <p className="text-sm">
                                                        Belum ada voucher.
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

                {data.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">
                            {data.total} voucher
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        vouchers.index().url,
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
                                        vouchers.index().url,
                                        { page: data.current_page - 1, search },
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
                                        vouchers.index().url,
                                        { page: data.current_page + 1, search },
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
                                        vouchers.index().url,
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
                            {editing ? 'Edit Voucher' : 'Tambah Voucher'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Kode *
                                </Label>
                                <Input
                                    value={form.code}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            code: e.target.value.toUpperCase(),
                                        })
                                    }
                                    placeholder="DISKON50"
                                    className="h-10 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Nama *
                                </Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Diskon 50%"
                                    className="h-10"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Tipe
                                </Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(v) =>
                                        setForm({ ...form, type: v })
                                    }
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">
                                            Nominal (Rp)
                                        </SelectItem>
                                        <SelectItem value="percentage">
                                            Persen (%)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Nilai{' '}
                                    {form.type === 'percentage'
                                        ? '(%)'
                                        : '(Rp)'}{' '}
                                    *
                                </Label>
                                <Input
                                    type="number"
                                    value={form.value}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            value: e.target.value,
                                        })
                                    }
                                    placeholder={
                                        form.type === 'percentage'
                                            ? '10'
                                            : '10000'
                                    }
                                    className="h-10"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Min. Order (Rp)
                                </Label>
                                <Input
                                    type="number"
                                    value={form.min_order_amount}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            min_order_amount: e.target.value,
                                        })
                                    }
                                    placeholder="0"
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Maks. Diskon (Rp)
                                </Label>
                                <Input
                                    type="number"
                                    value={form.max_discount}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            max_discount: e.target.value,
                                        })
                                    }
                                    placeholder="Kosong = tidak terbatas"
                                    className="h-10"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Berlaku Dari
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={form.valid_from}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            valid_from: e.target.value,
                                        })
                                    }
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Berlaku Sampai
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={form.valid_until}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            valid_until: e.target.value,
                                        })
                                    }
                                    className="h-10"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Maks. Pemakaian
                                </Label>
                                <Input
                                    type="number"
                                    value={form.max_uses}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            max_uses: e.target.value,
                                        })
                                    }
                                    placeholder="Kosong = tidak terbatas"
                                    className="h-10"
                                />
                            </div>
                            <div className="flex items-end space-y-2 pb-1">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                is_active: e.target.checked,
                                            })
                                        }
                                        className="size-4 rounded border-neutral-300 text-black focus:ring-black"
                                    />
                                    <span className="text-[13px] font-medium">
                                        Aktif
                                    </span>
                                </label>
                            </div>
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
                                disabled={
                                    loading ||
                                    !form.code ||
                                    !form.name ||
                                    !form.value
                                }
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
                        <DialogTitle>Hapus Voucher</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Apakah Anda yakin ingin menghapus voucher ini?
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
