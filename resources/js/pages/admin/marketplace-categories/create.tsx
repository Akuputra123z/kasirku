import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ParentOption {
    id: number;
    name: string;
}

export default function CreateMarketplaceCategory({ parents }: { parents: ParentOption[] }) {
    const { data, setData, post, processing, errors } = useForm({
        parent_id: '',
        name: '',
        slug: '',
        icon: '',
        sort_order: '0',
        is_active: true,
        keywords: '',
    });

    function setIcon(val: string) {
        setData('icon', val === 'no-icon' ? '' : val);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/marketplace/categories');
    }

    return (
        <>
            <Head title="Admin - Tambah Kategori" />
            <div className="px-4 py-6 max-w-2xl">
                <div className="mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/marketplace/categories">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
                        </Link>
                    </Button>
                </div>
                <Heading title="Tambah Kategori" description="Buat kategori marketplace baru" />
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Informasi Kategori</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="parent_id">Kategori Induk</Label>
                                <Select value={data.parent_id} onValueChange={(v) => setData('parent_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kategori utama (biarkan kosong)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {parents.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Kategori *</Label>
                                <Input id="name" value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Dekorasi" />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input id="slug" value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="Kosongi untuk auto-generate" />
                                {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="icon">Icon</Label>
                                <Select value={data.icon || 'no-icon'} onValueChange={setIcon}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih icon (hanya untuk kategori utama)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no-icon">Tidak ada</SelectItem>
                                        {['Armchair', 'Shirt', 'UtensilsCrossed', 'Sparkles', 'Laptop', 'Flower2', 'Trophy', 'LayoutGrid', 'Store'].map((icon) => (
                                            <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sort_order">Urutan</Label>
                                <Input id="sort_order" type="number" value={data.sort_order}
                                    onChange={(e) => setData('sort_order', e.target.value)} />
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_active" checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-slate-300" />
                                <Label htmlFor="is_active" className="mb-0">Aktif</Label>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="keywords">Keywords (satu per baris)</Label>
                                <Textarea id="keywords" value={data.keywords}
                                    onChange={(e) => setData('keywords', e.target.value)}
                                    placeholder="Cover Kipas Angin&#10;Cover Kursi&#10;Hiasan Dinding"
                                    rows={8} />
                                <p className="text-xs text-muted-foreground">
                                    Gunakan untuk mencocokkan produk berdasarkan nama kategori toko. Satu keyword per baris.
                                </p>
                            </div>

                            <Button type="submit" disabled={processing}>
                                Simpan
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
