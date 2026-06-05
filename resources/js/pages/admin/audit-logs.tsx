'use client';

import { Head, router } from '@inertiajs/react';
import { Activity, Search } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

type LogRow = {
    id: number;
    user: string;
    action: string;
    description: string;
    subject: string;
    ip_address: string | null;
    created_at: string;
};

export default function AuditLogs({
    logs,
    filters = {},
}: {
    logs: { data: LogRow[] };
    filters?: { search?: string; event?: string; type?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [eventFilter, setEventFilter] = useState(filters.event ?? 'all');
    const [typeFilter, setTypeFilter] = useState(filters.type ?? 'all');

    const eventLabels: Record<string, string> = {
        all: 'Semua Aksi',
        suspended: 'Ditangguhkan',
        activated: 'Diaktifkan',
        entered: 'Masuk Toko',
        updated: 'Diperbarui',
        reset: 'Reset DB',
        bulk_activate: 'Aktivasi Massal',
        bulk_suspend: 'Tangguhkan Massal',
        bulk_delete: 'Hapus Massal',
        created: 'Dibuat',
        deleted: 'Dihapus',
        restored: 'Dipulihkan',
    };

    const applyFilters = () => {
        const params: Record<string, string> = {};

        if (search) {
            params.search = search;
        }

        if (eventFilter !== 'all') {
            params.event = eventFilter;
        }

        if (typeFilter !== 'all') {
            params.type = typeFilter;
        }

        router.get('/admin/audit-logs', params, {
            preserveState: true,
            replace: true,
        });
    };

    const navigate = (params: Record<string, string>) => {
        router.get('/admin/audit-logs', params, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <>
            <Head title="Admin - Audit Logs" />
            <div className="px-4 py-6">
                <Heading
                    title="Audit Log"
                    description="Activity log for all admin actions"
                />

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Riwayat Aktivitas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari aksi, deskripsi, atau model..."
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
                                value={typeFilter}
                                onValueChange={(v) => {
                                    setTypeFilter(v);
                                    const params: Record<string, string> = {};

                                    if (search) {
                                        params.search = search;
                                    }

                                    if (eventFilter !== 'all') {
                                        params.event = eventFilter;
                                    }

                                    if (v !== 'all') {
                                        params.type = v;
                                    }

                                    navigate(params);
                                }}
                            >
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Tipe
                                    </SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="model">
                                        Data Toko
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={eventFilter}
                                onValueChange={(v) => {
                                    setEventFilter(v);
                                    const params: Record<string, string> = {};

                                    if (search) {
                                        params.search = search;
                                    }

                                    if (v !== 'all') {
                                        params.event = v;
                                    }

                                    if (typeFilter !== 'all') {
                                        params.type = typeFilter;
                                    }

                                    navigate(params);
                                }}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter aksi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(eventLabels).map(
                                        ([val, label]) => (
                                            <SelectItem key={val} value={val}>
                                                {label}
                                            </SelectItem>
                                        ),
                                    )}
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

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Aksi</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Waktu</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-12 text-center text-muted-foreground"
                                        >
                                            Belum ada aktivitas tercatat.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.data.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium">
                                                {log.user}
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                                                    {eventLabels[log.action] ??
                                                        log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {log.subject || '-'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {log.description}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {log.ip_address ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {log.created_at}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AuditLogs.layout = {
    breadcrumbs: [{ title: 'Admin', href: home() }],
};
