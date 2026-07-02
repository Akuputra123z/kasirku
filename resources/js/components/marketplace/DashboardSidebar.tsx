import { Link } from '@inertiajs/react';
import { Store, MessageSquare, Star, HelpCircle, AlertTriangle, Clock, ShoppingBag, Heart, Settings as SettingsIcon, LogOut, Smartphone } from 'lucide-react';
import { logout as logoutRoute } from '@/routes/marketplace';

type MenuItem = { key: string; label: string; icon: React.ElementType };

const menus: MenuItem[] = [
    { key: 'chat', label: 'Chat', icon: MessageSquare },
    { key: 'ulasan', label: 'Ulasan', icon: Star },
    { key: 'bantuan', label: 'Pesan Bantuan', icon: HelpCircle },
    { key: 'komplain', label: 'Pesanan Dikomplain', icon: AlertTriangle },
];

const purchaseMenus: MenuItem[] = [
    { key: 'menunggu', label: 'Menunggu Pembayaran', icon: Clock },
    { key: 'transaksi', label: 'Daftar Transaksi', icon: ShoppingBag },
];

const profileMenus: MenuItem[] = [
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
];

const serviceMenus: MenuItem[] = [
    { key: 'ppob', label: 'PPOB / Pembayaran', icon: Smartphone },
];

const settingsMenus: MenuItem[] = [
    { key: 'pengaturan', label: 'Pengaturan', icon: SettingsIcon },
];

export default function DashboardSidebar({
    user,
    memberLevel = 'Silver',
    pointsToNextLevel = 0,
    activeSection,
    onNavigate,
}: {
    user: any;
    memberLevel?: string;
    pointsToNextLevel?: number;
    activeSection: string;
    onNavigate: (key: string) => void;
}) {
    const initial = (user?.name?.[0] || 'U').toUpperCase();

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-3">
                <Link href="/customer/dashboard" className="flex items-center gap-3" onClick={() => onNavigate('beranda')}>
                    <div className="size-10 shrink-0 rounded-full bg-gradient-to-tr from-[#4648d4] to-blue-800 p-0.5">
                        <div className="size-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            {user?.profile_photo_url ? (
                                <img src={user.profile_photo_url} alt="" className="size-full object-cover" />
                            ) : (
                                <span className="text-sm font-bold text-[#4648d4]">{initial}</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-sm">{user?.name || 'Customer'}</p>
                        <p className="text-[10px] text-gray-400">Member {memberLevel}</p>
                    </div>
                </Link>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4648d4] w-2/3 rounded-full"></div>
                </div>
                <p className="text-[10px] text-gray-400 text-right">{pointsToNextLevel} poin lagi ke Gold</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col gap-4">
                {!user?.has_store && (
                    <Link href="/customer/buka-toko"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#4648d4] bg-[#eef0ff] font-semibold hover:bg-[#e0e2ff] transition-colors"
                    >
                        <Store className="size-4" />
                        Buka Toko
                    </Link>
                )}

                <div>
                    <span className="font-bold text-xs uppercase tracking-wider block mb-2 text-gray-500">Kotak Masuk</span>
                    <ul className="space-y-1">
                        {menus.map((m) => (
                            <li key={m.key}>
                                <button
                                    onClick={() => onNavigate(m.key)}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm w-full text-left transition-colors ${
                                        activeSection === m.key
                                            ? 'text-[#4648d4] bg-[#eef0ff] font-bold'
                                            : 'text-gray-600 hover:text-[#4648d4] hover:bg-gray-50'
                                    }`}
                                >
                                    <m.icon className="size-4 shrink-0" />
                                    {m.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <span className="font-bold text-xs uppercase tracking-wider block mb-2 text-gray-500">Pembelian</span>
                    <ul className="space-y-1">
                        {purchaseMenus.map((m) => (
                            <li key={m.key}>
                                <button
                                    onClick={() => onNavigate(m.key)}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm w-full text-left transition-colors ${
                                        activeSection === m.key
                                            ? 'text-[#4648d4] bg-[#eef0ff] font-bold'
                                            : 'text-gray-600 hover:text-[#4648d4] hover:bg-gray-50'
                                    }`}
                                >
                                    <m.icon className="size-4 shrink-0" />
                                    {m.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <span className="font-bold text-xs uppercase tracking-wider block mb-2 text-gray-500">Layanan</span>
                    <ul className="space-y-1">
                        {serviceMenus.map((m) => (
                            <li key={m.key}>
                                <button
                                    onClick={() => onNavigate(m.key)}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm w-full text-left transition-colors ${
                                        activeSection === m.key
                                            ? 'text-[#4648d4] bg-[#eef0ff] font-bold'
                                            : 'text-gray-600 hover:text-[#4648d4] hover:bg-gray-50'
                                    }`}
                                >
                                    <m.icon className="size-4 shrink-0" />
                                    {m.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <span className="font-bold text-xs uppercase tracking-wider block mb-2 text-gray-500">Profil Saya</span>
                    <ul className="space-y-1">
                        {profileMenus.map((m) => (
                            <li key={m.key}>
                                <button
                                    onClick={() => onNavigate(m.key)}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm w-full text-left transition-colors ${
                                        activeSection === m.key
                                            ? 'text-[#4648d4] bg-[#eef0ff] font-bold'
                                            : 'text-gray-600 hover:text-[#4648d4] hover:bg-gray-50'
                                    }`}
                                >
                                    <m.icon className="size-4 shrink-0" />
                                    {m.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <span className="font-bold text-xs uppercase tracking-wider block mb-2 text-gray-500">Pengaturan</span>
                    <ul className="space-y-1">
                        {settingsMenus.map((m) => (
                            <li key={m.key}>
                                <button
                                    onClick={() => onNavigate(m.key)}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm w-full text-left transition-colors ${
                                        activeSection === m.key
                                            ? 'text-[#4648d4] bg-[#eef0ff] font-bold'
                                            : 'text-gray-600 hover:text-[#4648d4] hover:bg-gray-50'
                                    }`}
                                >
                                    <m.icon className="size-4 shrink-0" />
                                    {m.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <hr className="border-gray-100" />

                <Link href={logoutRoute()} method="post" as="button"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="size-4" />
                    Keluar
                </Link>
            </div>
        </aside>
    );
}
