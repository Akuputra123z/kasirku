'use client';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Plus,
    Pencil,
    Trash2,
    Search,
    Users,
    Shield,
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
import users from '@/routes/users';

interface UserData {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles: { id: number; name: string }[];
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface PageProps extends Record<string, unknown> {
    users: Paginator<UserData>;
    roles: string[];
    filters: { search: string | null };
}

const roleLabels: Record<string, string> = {
    admin: 'Admin',
    supervisor: 'Supervisor',
    kasir: 'Kasir',
};

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export default function UsersIndex() {
    const { users: data, roles, filters } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<UserData | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
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
                users.index().url,
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
        setForm({ name: '', email: '', password: '', role: '' });
        setShowForm(true);
    };

    const openEdit = (u: UserData) => {
        setEditing(u);
        setForm({
            name: u.name,
            email: u.email,
            password: '',
            role: u.roles[0]?.name ?? '',
        });
        setShowForm(true);
    };

    const save = () => {
        setLoading(true);

        if (editing) {
            router.patch(users.update({ user: editing.id }).url, form, {
                preserveScroll: true,
                onSuccess: () => toast.success('Pengguna berhasil diperbarui.'),
                onFinish: () => {
                    setLoading(false);
                    setShowForm(false);
                    setEditing(null);
                },
            });
        } else {
            router.post(users.store().url, form, {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Pengguna berhasil ditambahkan.'),
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

        router.delete(users.destroy({ user: deleteId }).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Pengguna berhasil dihapus.'),
            onFinish: () => setDeleteId(null),
        });
    };

    return (
        <>
            <Head title="Pengguna" />
            <div className="min-h-screen space-y-6 bg-neutral-50 p-4 md:p-8 dark:bg-neutral-950">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Pengguna
                        </h1>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                            Kelola pegawai dan hak akses mereka.
                        </p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="h-9 gap-2 bg-black px-4 font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black"
                    >
                        <Plus className="size-3.5" /> Tambah Pengguna
                    </Button>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama atau email..."
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

                {/* Table */}
                <Card className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-950">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-neutral-100 hover:bg-transparent dark:border-neutral-900">
                                        <TableHead className="px-4 py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Nama
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Email
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Role
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Bergabung
                                        </TableHead>
                                        <TableHead className="w-24 px-4 py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.length > 0 ? (
                                        data.data.map((u) => (
                                            <TableRow
                                                key={u.id}
                                                className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                            >
                                                <TableCell className="px-4 py-3 font-semibold">
                                                    {u.name}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-muted-foreground">
                                                    {u.email}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-center">
                                                    {u.roles.map((r) => (
                                                        <Badge
                                                            key={r.id}
                                                            variant="secondary"
                                                            className="rounded-md text-[11px] capitalize"
                                                        >
                                                            <Shield className="mr-1 inline size-3" />
                                                            {roleLabels[
                                                                r.name
                                                            ] ?? r.name}
                                                        </Badge>
                                                    ))}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-center text-sm text-muted-foreground">
                                                    {fmtDate(u.created_at)}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() =>
                                                                openEdit(u)
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
                                                                    u.id,
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
                                                        Belum ada pengguna.
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
                            {data.total} pengguna
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        users.index().url,
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
                                        users.index().url,
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
                                        users.index().url,
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
                                        users.index().url,
                                        {
                                            page: data.last_page,
                                            search,
                                        },
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
                            {editing ? 'Edit Pengguna' : 'Tambah Pengguna'}
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
                                placeholder="Nama lengkap"
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                Email *
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
                                Password{' '}
                                {editing
                                    ? '(biarkan kosong jika tidak diubah)'
                                    : '*'}
                            </Label>
                            <Input
                                type="password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        password: e.target.value,
                                    })
                                }
                                placeholder={
                                    editing
                                        ? 'Kosongkan jika tidak diubah'
                                        : 'Minimal 8 karakter'
                                }
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                                Role *
                            </Label>
                            <Select
                                value={form.role}
                                onValueChange={(val) =>
                                    setForm({ ...form, role: val })
                                }
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Pilih role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            <span className="capitalize">
                                                {roleLabels[role] ?? role}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    !form.name ||
                                    !form.email ||
                                    !form.role ||
                                    (!editing && !form.password)
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
                        <DialogTitle>Hapus Pengguna</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Apakah Anda yakin ingin menghapus pengguna ini?
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
