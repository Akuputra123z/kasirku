import { Head, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CheckCircle2,
    XCircle,
    Plus,
    Pencil,
    Trash2,
    Search,
    Users,
    Shield,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
    flash?: { success?: string; error?: string };
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
    const { users, roles, filters, flash } = usePage<PageProps>().props;

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
    const [page, setPage] = useState(users.current_page);

    const searchUsers = () => {
        router.get('/users', { search }, { preserveState: true });
    };

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
            router.patch(`/users/${editing.id}`, form, {
                preserveScroll: true,
                onFinish: () => {
                    setLoading(false);
                    setShowForm(false);
                    setEditing(null);
                },
            });
        } else {
            router.post('/users', form, {
                preserveScroll: true,
                onFinish: () => {
                    setLoading(false);
                    setShowForm(false);
                },
            });
        }
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        router.delete(`/users/${deleteId}`, {
            preserveScroll: true,
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
                            placeholder="Cari nama atau email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && searchUsers()
                            }
                            className="h-9 pl-9 text-[13px]"
                        />
                    </div>
                    <Button
                        onClick={searchUsers}
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
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Bergabung
                                    </th>
                                    <th className="w-24 px-4 py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length > 0 ? (
                                    users.data.map((u) => (
                                        <tr
                                            key={u.id}
                                            className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                                        >
                                            <td className="px-4 py-3 font-semibold">
                                                {u.name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {u.email}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {u.roles.map((r) => (
                                                    <Badge
                                                        key={r.id}
                                                        variant="secondary"
                                                        className="rounded-md text-[11px] capitalize"
                                                    >
                                                        <Shield className="mr-1 inline size-3" />
                                                        {roleLabels[r.name] ??
                                                            r.name}
                                                    </Badge>
                                                ))}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                                {fmtDate(u.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
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
                                                            setDeleteId(u.id)
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
                                                    Belum ada pengguna.
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
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">
                            {users.total} pengguna
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        '/users',
                                        { page: 1, search },
                                        { preserveState: true },
                                    )
                                }
                                disabled={users.current_page === 1}
                            >
                                <ChevronsLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        '/users',
                                        {
                                            page: users.current_page - 1,
                                            search,
                                        },
                                        { preserveState: true },
                                    )
                                }
                                disabled={users.current_page === 1}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="min-w-[80px] text-center text-[13px] text-muted-foreground">
                                {users.current_page} / {users.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    router.get(
                                        '/users',
                                        {
                                            page: users.current_page + 1,
                                            search,
                                        },
                                        { preserveState: true },
                                    )
                                }
                                disabled={
                                    users.current_page === users.last_page
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
                                        '/users',
                                        {
                                            page: users.last_page,
                                            search,
                                        },
                                        { preserveState: true },
                                    )
                                }
                                disabled={
                                    users.current_page === users.last_page
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
                    if (!open) setDeleteId(null);
                }}
            >
                <DialogContent className="sm:max-w-sm">
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
