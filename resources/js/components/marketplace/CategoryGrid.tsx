import { Link } from '@inertiajs/react';
import { Laptop, UtensilsCrossed, Shirt, Sparkles, Armchair, Flower2, Trophy, Grid } from 'lucide-react';

const categories = [
    { name: 'Rumah Tangga', icon: Armchair, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', slug: 'rumah-tangga' },
    { name: 'Fashion', icon: Shirt, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', slug: 'fashion' },
    { name: 'Kuliner', icon: UtensilsCrossed, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', slug: 'kuliner' },
    { name: 'Kecantikan', icon: Sparkles, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', slug: 'kecantikan' },
    { name: 'Elektronik', icon: Laptop, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', slug: 'elektronik' },
    { name: 'Agribisnis', icon: Flower2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', slug: 'agribisnis' },
    { name: 'Olahraga', icon: Trophy, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', slug: 'olahraga' },
    { name: 'Lainnya', icon: Grid, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-slate-800', slug: '' },
];

export default function CategoryGrid() {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                Kategori Populer
                <span className="ml-2 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                    Baru
                </span>
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                {categories.map((cat) => (
                    <Link key={cat.name} href={cat.slug ? `/all-products?category=${cat.slug}` : '/all-products'}
                        className="flex flex-col items-center space-y-2 group">
                        <div className={`w-14 h-14 ${cat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <cat.icon className={`size-6 ${cat.color}`} />
                        </div>
                        <span className="text-xs font-medium text-center">{cat.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
