import { Head } from '@inertiajs/react';
import { ExternalLink, Globe, Store } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    id: string;
    name: string;
    slug: string;
    created_at: string;
    domains: { domain: string }[];
};

export default function AdminTenants({
    tenants,
}: {
    tenants: { data: TenantRow[] };
}) {
    return (
        <>
            <Head title="Admin - Tenants" />
            <div className="px-4 py-6">
                <Heading
                    title="Store Management"
                    description="View all registered stores"
                />
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            All Stores
                        </CardTitle>
                        <CardDescription>
                            {tenants.data.length} stores registered
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Store Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Domain</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead className="w-20" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenants.data.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell className="font-medium">
                                            {tenant.name}
                                        </TableCell>
                                        <TableCell>{tenant.slug}</TableCell>
                                        <TableCell>
                                            {tenant.domains?.map((d) => (
                                                <span
                                                    key={d.domain}
                                                    className="flex items-center gap-1 text-sm"
                                                >
                                                    <Globe className="h-3 w-3" />
                                                    {d.domain}
                                                </span>
                                            ))}
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
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminTenants.layout = {
    breadcrumbs: [{ title: 'Admin', href: home() }],
};
