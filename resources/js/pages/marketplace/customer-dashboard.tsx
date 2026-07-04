'use client';

import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Receipt, Heart, Wallet, TrendingUp, Award, Ticket,
    ChevronRight, ChevronLeft, Search, BadgeCheck, Star,
    Package, Truck, Home, Check, Info, Store, Camera, User,
    Clock, AlertTriangle, MessageCircle, MapPin, Bell,
    Plus, Pencil, Trash2, CheckCircle, Building, KeyRound, CreditCard, Eye,
} from 'lucide-react';
import { useState } from 'react';
import DashboardSidebar from '@/components/marketplace/DashboardSidebar';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function statusConfig(status: string) {
    const map: Record<string, { label: string; style: string }> = {
        pending: { label: 'Menunggu Pembayaran', style: 'bg-[#FBBF24]/10 text-[#FBBF24]' },
        confirmed: { label: 'Dikonfirmasi', style: 'bg-blue-50 text-blue-600' },
        shipped: { label: 'Dikirim', style: 'bg-purple-50 text-purple-600' },
        completed: { label: 'Selesai', style: 'bg-emerald-50 text-emerald-600' },
        cancelled: { label: 'Dibatalkan', style: 'bg-red-50 text-red-500' },
    };
    return map[status] || { label: status, style: 'bg-gray-100 text-gray-600' };
}

const now = new Date();
const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const steps = [
    { key: 'pending', icon: Check, label: 'Bayar' },
    { key: 'confirmed', icon: Package, label: 'Diproses' },
    { key: 'shipped', icon: Truck, label: 'Dikirim' },
    { key: 'completed', icon: Home, label: 'Sampai' },
];

type StatCardProps = { icon: React.ElementType; bg: string; iconColor: string; label: string; value: string | number; footer?: React.ReactNode };
function StatCard({ icon: Icon, bg, iconColor, label, value, footer }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full group-hover:scale-110 transition-transform" style={{ backgroundColor: bg }} />
            <div className="relative z-10">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: bg, color: iconColor }}>
                    <Icon className="size-5" />
                </div>
                <p className="text-sm text-slate-500 mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                {footer && <div className="mt-2">{footer}</div>}
            </div>
        </div>
    );
}

type Address = {
    id: number;
    label: string | null;
    recipient_name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postal_code: string | null;
    is_default: boolean;
};

type BankAccount = {
    id: number;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    is_default: boolean;
};

type PageProps = {
    auth: any; cartCount?: number;
    stats: { total_spending: number; total_orders: number; completed_orders: number; reward_points: number; address_count: number };
    activeOrder: any; recentOrders: any[]; orders: any; recommendations: any[];
    addresses: Address[];
    bankAccounts: BankAccount[];
    memberLevel: string; pointsToNextLevel: number;
    initialSection?: string;
};

function formatProductLink(p: any) {
    const slug = p.tenant_slug || 'store';
    const productSlug = p.slug || p.id;
    return `/store/${slug}/products/${productSlug}`;
}

function AddressForm({ address, onCancel, onSubmit }: { address: Address | null; onCancel: () => void; onSubmit: (data: any) => void }) {
    const isEdit = !!address;
    const [label, setLabel] = useState(address?.label || '');
    const [recipientName, setRecipientName] = useState(address?.recipient_name || '');
    const [phone, setPhone] = useState(address?.phone || '');
    const [addr, setAddr] = useState(address?.address || '');
    const [city, setCity] = useState(address?.city || '');
    const [province, setProvince] = useState(address?.province || '');
    const [postalCode, setPostalCode] = useState(address?.postal_code || '');
    const [isDefault, setIsDefault] = useState(address?.is_default || false);
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!recipientName.trim() || !phone.trim() || !addr.trim() || !city.trim() || !province.trim()) return;
        setSubmitting(true);
        onSubmit({
            label: label || null,
            recipient_name: recipientName,
            phone,
            address: addr,
            city,
            province,
            postal_code: postalCode || null,
            is_default: isDefault,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50/50">
            <h4 className="font-bold text-sm text-slate-900">{isEdit ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Label (opsional)</label>
                    <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rumah, Kantor, dll"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Penerima *</label>
                    <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Nama lengkap"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">No. HP *</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08123456789"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Provinsi *</label>
                    <input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Jawa Barat"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Kota *</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bandung"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Kode Pos</label>
                    <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="40123"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                </div>
            </div>
            <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Alamat Lengkap *</label>
                <textarea value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Jl. Contoh No. 123, RT/RW 001/002" rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-gray-300 text-[#4648d4] focus:ring-[#4648d4]" />
                <span className="text-xs font-medium text-slate-600">Jadikan alamat utama</span>
            </label>
            <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={submitting}
                    className="px-5 py-2 bg-[#4648d4] text-white rounded-xl text-sm font-semibold hover:bg-[#3b3db8] transition-colors disabled:opacity-50">
                    {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Alamat'}
                </button>
                <button type="button" onClick={onCancel}
                    className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                    Batal
                </button>
            </div>
        </form>
    );
}

function BiodataForm({ user, customer }: { user: any; customer: any }) {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(customer?.phone || '');
    const [submitting, setSubmitting] = useState(false);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;
        setSubmitting(true);
        router.put('/customer/profile', { name, email, phone: phone || null }, {
            onFinish: () => setSubmitting(false),
        });
    }

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        setAvatarFile(f);
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(f);

        setAvatarUploading(true);
        const formData = new FormData();
        formData.append('photo', f);
        router.post('/customer/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            preserveScroll: true,
            onSuccess: () => { setAvatarFile(null); },
            onFinish: () => setAvatarUploading(false),
        });
    }

    const displayUrl = avatarPreview || user?.profile_photo_url || null;

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="size-28 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                    {displayUrl ? (
                        <img src={displayUrl} alt="" className="size-full object-cover" />
                    ) : (
                        <div className="size-full flex items-center justify-center text-4xl font-bold text-[#4648d4]/30">
                            {(user?.name?.[0] || 'U').toUpperCase()}
                        </div>
                    )}
                </div>
                <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                    {avatarUploading ? (
                        <span className="size-4 animate-spin border-2 border-gray-400 border-t-transparent rounded-full" />
                    ) : (
                        <Camera className="size-4" />
                    )}
                    {avatarUploading ? 'Mengupload...' : 'Pilih Foto'}
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={avatarUploading} />
                </label>
                <p className="text-[11px] text-slate-400 text-center">Maks. 2MB<br />JPG, PNG, WebP</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Lengkap</label>
                    <input value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">No. HP</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08123456789"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                </div>
                <button type="submit" disabled={submitting}
                    className="px-5 py-2 bg-[#4648d4] text-white rounded-xl text-sm font-semibold hover:bg-[#3b3db8] transition-colors disabled:opacity-50">
                    {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </form>
        </div>
    );
}

function PasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentPassword || !newPassword || newPassword !== newPasswordConfirmation) return;
        setSubmitting(true);
        router.put('/customer/password', {
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: newPasswordConfirmation,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Password Saat Ini</label>
                <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
            </div>
            <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Password Baru</label>
                <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Min. 8 karakter"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
            </div>
            <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Konfirmasi Password Baru</label>
                <input value={newPasswordConfirmation} onChange={(e) => setNewPasswordConfirmation(e.target.value)} type="password"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
            </div>
            <button type="submit" disabled={submitting}
                className="px-5 py-2 bg-[#4648d4] text-white rounded-xl text-sm font-semibold hover:bg-[#3b3db8] transition-colors disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Ubah Password'}
            </button>
        </form>
    );
}
function BankAccountSection({ accounts }: { accounts: BankAccount[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<BankAccount | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    function resetForm() {
        setBankName(''); setAccountNumber(''); setAccountHolder(''); setIsDefault(false);
        setShowForm(false); setEditing(null);
    }

    function openEdit(acc: BankAccount) {
        setBankName(acc.bank_name);
        setAccountNumber(acc.account_number);
        setAccountHolder(acc.account_holder_name);
        setIsDefault(acc.is_default);
        setEditing(acc);
        setShowForm(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) return;
        setSubmitting(true);
        const payload = { bank_name: bankName, account_number: accountNumber, account_holder_name: accountHolder, is_default: isDefault ? 1 : 0 };

        if (editing) {
            router.put(`/customer/bank-account/${editing.id}`, payload);
        } else {
            router.post('/customer/bank-account', payload);
        }
        resetForm();
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm text-slate-900">Rekening Bank</h4>
                {!showForm && (
                    <button onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4648d4] text-white rounded-lg text-xs font-semibold hover:bg-[#3b3db8] transition-colors">
                        <Plus className="size-3.5" /> Tambah
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Bank</label>
                        <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA, Mandiri, BRI..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">No. Rekening</label>
                        <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="1234567890"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Atas Nama</label>
                        <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="John Doe"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none transition-colors" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
                            className="rounded border-gray-300 text-[#4648d4] focus:ring-[#4648d4]" />
                        <span className="text-xs font-medium text-slate-600">Rekening utama</span>
                    </label>
                    <div className="flex items-center gap-3">
                        <button type="submit" disabled={submitting}
                            className="px-4 py-2 bg-[#4648d4] text-white rounded-lg text-sm font-semibold hover:bg-[#3b3db8] transition-colors disabled:opacity-50">
                            {submitting ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan'}
                        </button>
                        <button type="button" onClick={resetForm}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                            Batal
                        </button>
                    </div>
                </form>
            )}

            {!showForm && (!accounts || accounts.length === 0) ? (
                <div className="text-center py-8">
                    <Building className="size-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-slate-500">Belum ada rekening tersimpan</p>
                </div>
            ) : !showForm ? (
                <div className="space-y-3">
                    {accounts.map((acc) => (
                        <div key={acc.id} className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm text-slate-900">{acc.bank_name}</span>
                                        {acc.is_default && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle className="size-3 inline" /> Utama</span>}
                                    </div>
                                    <p className="text-sm text-slate-700">{acc.account_number}</p>
                                    <p className="text-xs text-slate-500">{acc.account_holder_name}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => openEdit(acc)} className="p-1.5 text-gray-400 hover:text-[#4648d4] hover:bg-[#eef0ff] rounded-lg transition-colors" title="Edit"><Pencil className="size-3.5" /></button>
                                    <button onClick={() => setDeleteId(acc.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 className="size-3.5" /></button>
                                </div>
                            </div>
                            {deleteId === acc.id && (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                                    <p className="text-xs text-slate-500">Hapus rekening ini?</p>
                                    <button onClick={() => { router.delete(`/customer/bank-account/${acc.id}`); setDeleteId(null); }} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors">Ya, Hapus</button>
                                    <button onClick={() => setDeleteId(null)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors">Batal</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export default function CustomerDashboard() {
    const { auth, cartCount, stats, activeOrder, recentOrders, orders, recommendations, memberLevel, pointsToNextLevel, addresses, bankAccounts, complaints, initialSection, notifications, unreadCount } = usePage<any>().props;
    const user = auth?.user;
    const [activeSection, setActiveSection] = useState(initialSection || 'beranda');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filtered = orders?.data?.filter((o: any) => {
        if (statusFilter && o.status !== statusFilter && o.payment_status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return o.order_number.toLowerCase().includes(q) || o.store_name.toLowerCase().includes(q) || o.items?.some((i: any) => i.product_name.toLowerCase().includes(q));
        }
        return true;
    });

    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    const [settingsSection, setSettingsSection] = useState('biodata');

    const [complaintSearch, setComplaintSearch] = useState('');
    const [complaintFilter, setComplaintFilter] = useState('');

    const [showComplaintForm, setShowComplaintForm] = useState<number | null>(null);
    const [complaintReason, setComplaintReason] = useState('wrong_product');
    const [complaintDesc, setComplaintDesc] = useState('');
    const [complaintSubmitting, setComplaintSubmitting] = useState(false);

    const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
    const [reviewTexts, setReviewTexts] = useState<Record<string, string>>({});
    const [reviewSubmitting, setReviewSubmitting] = useState<Record<string, boolean>>({});

    function getSectionTitle(): string {
        const map: Record<string, string> = {
            chat: 'Chat', ulasan: 'Ulasan', bantuan: 'Pesan Bantuan',
            komplain: 'Pesanan Dikomplain', menunggu: 'Menunggu Pembayaran',
            transaksi: 'Daftar Transaksi', wishlist: 'Wishlist',
            pengaturan: 'Pengaturan', notifications: 'Notifikasi',
        };
        return map[activeSection] || 'Dashboard';
    }

    function handleSidebarNavigate(key: string) {
        if (key === 'transaksi') router.get('/customer/orders');
        else if (key === 'pengaturan') router.get('/customer/settings');
        else if (key === 'chat') router.get('/customer/conversations');
        else if (key === 'ppob') router.get('/ppob');
        else if (key === 'ulasan') router.get('/customer/dashboard?section=ulasan');
        else setActiveSection(key);
    }

    return (
        <>
            <Head title={`${getSectionTitle()} - Kasirku Marketplace`} />
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <DashboardSidebar
                        user={user}
                        memberLevel={memberLevel}
                        pointsToNextLevel={pointsToNextLevel}
                        activeSection={activeSection}
                        onNavigate={handleSidebarNavigate}
                    />

                    {/* ── Main Content ── */}
                    <div className="flex-1 space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                                    {activeSection === 'beranda' ? `Selamat Datang, ${user?.name?.split(' ')[0] || 'Customer'}!` : getSectionTitle()}
                                </h1>
                                <p className="text-slate-500">
                                    {activeSection === 'beranda' ? 'Siap belanja produk UMKM pilihan hari ini?' : `Kelola ${getSectionTitle().toLowerCase()} Anda`}
                                </p>
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Tanggal</p>
                                <p className="font-medium text-slate-700">{dateStr}</p>
                            </div>
                        </div>

                        {/* ── Beranda (Default) ── */}
                        {activeSection === 'beranda' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard
                                        icon={Wallet} label="Total Belanja"
                                        value={formatPrice(stats.total_spending)}
                                        bg="rgba(30,58,138,0.08)" iconColor="#1E3A8A"
                                        footer={<span className="text-xs text-emerald-500 flex items-center font-medium"><TrendingUp className="size-3.5 mr-1" />+12% bulan ini</span>}
                                    />
                                    <StatCard
                                        icon={Award} label="Poin Reward"
                                        value={`${stats.reward_points.toLocaleString()} Poin`}
                                        bg="rgba(234,179,8,0.12)" iconColor="#CA8A04"
                                        footer={<span className="text-xs text-slate-400">Dapat ditukar dengan voucher</span>}
                                    />
                                    <StatCard
                                        icon={Ticket} label="Voucher Tersedia"
                                        value={`${stats.available_vouchers} Voucher`}
                                        bg="rgba(16,185,129,0.1)" iconColor="#10B981"
                                        footer={<Link href="#" className="text-xs text-emerald-600 font-medium hover:underline flex items-center">Lihat Detail <ChevronRight className="size-3 ml-0.5" /></Link>}
                                    />
                                </div>

                                {/* Active Order / Recent Orders */}
                                {activeOrder ? (
                                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="font-bold text-lg flex items-center gap-2"><Truck className="size-5 text-emerald-600" /> Status Pesanan</h3>
                                            <Link href="/customer/orders" className="text-sm text-emerald-600 font-medium hover:underline">Lihat Semua Pesanan</Link>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-8">
                                            <div className="flex items-start gap-4 lg:w-1/3 min-w-[280px]">
                                                {activeOrder.first_item?.image ? (
                                                    <img alt={activeOrder.first_item.name} className="w-20 h-20 rounded-xl object-cover shadow-sm border border-gray-100" src={activeOrder.first_item.image} />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-slate-400"><Package className="size-8" /></div>
                                                )}
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{activeOrder.order_number}</p>
                                                    <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-relaxed">{activeOrder.first_item?.name || 'Pesanan'}</h4>
                                                    <p className="text-sm font-bold text-emerald-600 mt-2">{formatPrice(activeOrder.total)}</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 lg:pl-8 lg:border-l border-gray-100">
                                                <div className="relative flex items-center justify-between w-full mt-4 mb-8 px-4">
                                                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0 mx-4">
                                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(0, (activeOrder.progress / 3) * 100)}%` }}></div>
                                                    </div>
                                                    {steps.map((s, i) => {
                                                        const done = i < activeOrder.progress;
                                                        const act = i === activeOrder.progress;
                                                        const Icon = s.icon;
                                                        return (
                                                            <div key={s.key} className="relative z-10 flex flex-col items-center">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white ${done ? 'bg-emerald-500 text-white shadow-emerald-500/30' : act ? 'w-10 h-10 bg-white border-4 border-emerald-500 text-emerald-500 shadow-lg' : 'bg-gray-200 text-slate-400'}`}>
                                                                    <Icon className={act ? 'size-5 animate-pulse' : 'size-4'} />
                                                                </div>
                                                                <span className={`mt-2 font-bold ${act ? 'text-xs text-emerald-600' : 'text-[10px] text-slate-400'}`}>{s.label}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="bg-blue-50 text-blue-800 text-xs p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                                                    <Info className="size-4 mt-0.5 shrink-0" />
                                                    <p className="leading-relaxed">Paket sedang dalam perjalanan. Estimasi tiba besok, <span className="font-bold">{new Date(Date.now() + 86400000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : recentOrders.length > 0 ? (
                                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-lg flex items-center gap-2"><Receipt className="size-5 text-emerald-600" /> Pesanan Terbaru</h3>
                                            <button onClick={() => router.get('/customer/orders')} className="text-sm text-emerald-600 font-medium hover:underline">Lihat Semua</button>
                                        </div>
                                        <div className="space-y-3">
                                            {recentOrders.slice(0, 5).map((o: any) => (
                                                <div key={o.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-900">{o.order_number}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{o.store_name} &middot; {o.item_count} item &middot; {o.created_at}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm text-slate-900">{formatPrice(o.total)}</p>
                                                        <p className={`text-[10px] font-medium mt-0.5 ${o.status === 'completed' ? 'text-green-600' : o.status === 'pending' ? 'text-yellow-600' : o.status === 'cancelled' ? 'text-red-500' : 'text-blue-600'}`}>
                                                            {o.status === 'pending' ? 'Menunggu' : o.status === 'confirmed' ? 'Dikonfirmasi' : o.status === 'shipped' ? 'Dikirim' : o.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                                        <Package className="size-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-slate-500">Belum ada pesanan</p>
                                        <Link href="/stores" className="mt-4 inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                                            Mulai Belanja
                                        </Link>
                                    </div>
                                )}

                                {recommendations.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900">Rekomendasi Berdasarkan Minat</h3>
                                                <p className="text-sm text-slate-500">Produk pilihan khusus untuk kamu</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {recommendations.map((p: any) => (
                                                <Link key={p.id} href={formatProductLink(p)}
                                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col"
                                                >
                                                    <div className="relative overflow-hidden aspect-square">
                                                        {p.image ? (
                                                            <img alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={p.image} />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-slate-300"><Store className="size-12" /></div>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="block w-full bg-emerald-600 text-white text-[10px] font-bold py-1.5 rounded-lg text-center">Tambah Keranjang</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 flex-1 flex flex-col">
                                                        <div className="text-[10px] text-emerald-600 font-bold mb-1 uppercase tracking-wide">{p.category}</div>
                                                        <h3 className="text-sm font-medium mb-2 line-clamp-2 leading-snug text-slate-700 group-hover:text-emerald-600 transition-colors">{p.name}</h3>
                                                        <div className="mt-auto pt-2 border-t border-gray-50 flex items-end justify-between">
                                                            <div className="text-slate-900 font-bold text-sm">{formatPrice(p.price)}</div>
                                                            <div className="flex items-center">
                                                                <Star className="size-3 text-yellow-400 fill-yellow-400" />
                                                                <span className="text-[10px] text-slate-500 ml-1">{p.rating || '4.8'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── Daftar Transaksi ── */}
                        {activeSection === 'transaksi' && (
                            <>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg mb-4">Semua Transaksi</h3>
                                    <div className="flex h-12 w-full items-stretch overflow-hidden rounded-lg bg-[#4648d4]/5 mb-4">
                                        <div className="flex items-center justify-center pl-4 text-[#4648d4]">
                                            <Search className="size-5" />
                                        </div>
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="flex w-full min-w-0 flex-1 border-none bg-transparent px-4 py-2 text-base font-medium text-[#1E3A8A] placeholder:text-gray-400 focus:outline-none"
                                            placeholder="Cari pesanan, nomor invoice, atau nama produk..."
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2 pb-2">
                                        {[
                                            { key: '', label: 'Semua Status' },
                                            { key: 'unpaid', label: 'Menunggu Pembayaran' },
                                            { key: 'confirmed', label: 'Berlangsung' },
                                            { key: 'completed', label: 'Selesai' },
                                            { key: 'cancelled', label: 'Dibatalkan' },
                                        ].map((f) => (
                                            <button
                                                key={f.key}
                                                onClick={() => setStatusFilter(f.key)}
                                                className={`flex h-9 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-all ${
                                                    statusFilter === f.key
                                                        ? 'bg-[#4648d4] text-white'
                                                        : 'bg-gray-100 text-[#1E3A8A] hover:bg-gray-200'
                                                }`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {filtered?.length === 0 ? (
                                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                                        <Package className="size-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-slate-500">Belum ada transaksi</p>
                                        <Link href="/stores" className="mt-4 inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                                            Mulai Belanja
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {filtered?.map((order: any) => {
                                            const st = statusConfig(order.status);
                                            return (
                                                <div key={order.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                                                    <div className="flex flex-col md:flex-row md:items-stretch">
                                                        <div className="flex flex-[3] flex-col p-5">
                                                            <div className="mb-4 flex items-center gap-3">
                                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{order.created_at}</span>
                                                                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                                                <div className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 ${st.style}`}>
                                                                    <span className="text-xs font-bold uppercase tracking-wide">{st.label}</span>
                                                                </div>
                                                                <span className="hidden text-xs font-medium text-gray-500 sm:inline">{order.order_number}</span>
                                                            </div>
                                                            <div className="mb-2 flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-gray-700">{order.store_name}</p>
                                                                <span className="flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                                                                    <BadgeCheck className="size-3" /> UMKM
                                                                </span>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {order.items?.map((item: any, idx: number) => (
                                                                    <div key={item.id || idx} className="flex items-center gap-3">
                                                                        <div
                                                                            className="size-14 flex-shrink-0 rounded-lg border border-gray-100 bg-center bg-cover"
                                                                            style={{ backgroundImage: `url(${item.image_url || ''})`, backgroundColor: '#f0f0ff' }}
                                                                        >
                                                                            {!item.image_url && (
                                                                                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#4648d4]/30">
                                                                                    {item.product_name?.[0] || 'P'}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-sm font-semibold text-[#1E3A8A]">{item.product_name}</p>
                                                                                {item.variant_name && (
                                                                                    <p className="truncate text-xs text-gray-400">{item.variant_name}</p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex flex-shrink-0 items-center gap-3">
                                                                                <span className="text-xs text-gray-400">x{item.quantity}</span>
                                                                                <span className="text-sm font-bold text-[#1E3A8A]">{formatPrice(item.price)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-[1.5] flex-col justify-between border-t border-gray-100 bg-gray-50/50 p-5 md:border-l md:border-t-0">
                                                            <div className="mb-4">
                                                                <p className="text-xs text-gray-400">Total Belanja</p>
                                                                <p className="text-xl font-extrabold text-[#1E3A8A]">{formatPrice(order.total)}</p>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                {order.payment_status === 'unpaid' && (
                                                                    <Link href={`/customer/orders/${order.id}/payment`}>
                                                                        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#10B981] py-2 text-sm font-bold text-white shadow-sm hover:bg-[#10B981]/90">
                                                                            <CreditCard className="size-4" /> Bayar Sekarang
                                                                        </button>
                                                                    </Link>
                                                                )}
                                                                <Link href={`/customer/orders/${order.id}`}>
                                                                    <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-bold text-[#1E3A8A] hover:bg-gray-50">
                                                                        <Eye className="size-4" /> Detail Transaksi
                                                                    </button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {orders?.last_page > 1 && (
                                    <div className="flex items-center justify-center gap-4 pt-6">
                                        <button
                                            onClick={() => orders.prev_page_url && router.get(orders.prev_page_url)}
                                            disabled={!orders.prev_page_url}
                                            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:text-[#4648d4] transition-colors disabled:opacity-50"
                                        >
                                            <ChevronLeft className="size-5" />
                                        </button>
                                        <div className="flex gap-2">
                                            {Array.from({ length: orders.last_page }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => router.get(orders.path + '?page=' + page)}
                                                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                                                        orders.current_page === page
                                                            ? 'bg-[#4648d4] text-white'
                                                            : 'border border-gray-200 bg-white text-gray-500 hover:text-[#4648d4]'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => orders.next_page_url && router.get(orders.next_page_url)}
                                            disabled={!orders.next_page_url}
                                            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:text-[#4648d4] transition-colors disabled:opacity-50"
                                        >
                                            <ChevronRight className="size-5" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── Menunggu Pembayaran ── */}
                        {activeSection === 'menunggu' && (
                            <>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg mb-4">Menunggu Pembayaran</h3>
                                    <div className="flex h-12 w-full items-stretch overflow-hidden rounded-lg bg-[#4648d4]/5">
                                        <div className="flex items-center justify-center pl-4 text-[#4648d4]">
                                            <Search className="size-5" />
                                        </div>
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="flex w-full min-w-0 flex-1 border-none bg-transparent px-4 py-2 text-base font-medium text-[#1E3A8A] placeholder:text-gray-400 focus:outline-none"
                                            placeholder="Cari pesanan, nomor invoice, atau nama produk..."
                                        />
                                    </div>
                                </div>

                                {(() => {
                                    const pending = filtered?.filter((o: any) => o.payment_status === 'unpaid') || [];
                                    return pending.length === 0 ? (
                                        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                                            <Clock className="size-12 mx-auto text-gray-300 mb-3" />
                                            <p className="text-slate-500">Tidak ada pesanan yang menunggu pembayaran</p>
                                            <Link href="/stores" className="mt-4 inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                                                Mulai Belanja
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {pending.map((order: any) => {
                                                const st = statusConfig(order.status);
                                                return (
                                                    <div key={order.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                                                        <div className="flex flex-col md:flex-row md:items-stretch">
                                                            <div className="flex flex-[3] flex-col p-5">
                                                                <div className="mb-4 flex items-center gap-3">
                                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{order.created_at}</span>
                                                                    <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                                                    <div className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 ${st.style}`}>
                                                                        <span className="text-xs font-bold uppercase tracking-wide">{st.label}</span>
                                                                    </div>
                                                                    <span className="hidden text-xs font-medium text-gray-500 sm:inline">{order.order_number}</span>
                                                                </div>
                                                                <div className="mb-2 flex items-center gap-2">
                                                                    <p className="text-sm font-semibold text-gray-700">{order.store_name}</p>
                                                                    <span className="flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                                                                        <BadgeCheck className="size-3" /> UMKM
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {order.items?.map((item: any, idx: number) => (
                                                                        <div key={item.id || idx} className="flex items-center gap-3">
                                                                            <div
                                                                                className="size-14 flex-shrink-0 rounded-lg border border-gray-100 bg-center bg-cover"
                                                                                style={{ backgroundImage: `url(${item.image_url || ''})`, backgroundColor: '#f0f0ff' }}
                                                                            >
                                                                                {!item.image_url && (
                                                                                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#4648d4]/30">
                                                                                        {item.product_name?.[0] || 'P'}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                                                <div className="min-w-0">
                                                                                    <p className="truncate text-sm font-semibold text-[#1E3A8A]">{item.product_name}</p>
                                                                                    {item.variant_name && (
                                                                                        <p className="truncate text-xs text-gray-400">{item.variant_name}</p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex flex-shrink-0 items-center gap-3">
                                                                                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                                                                                    <span className="text-sm font-bold text-[#1E3A8A]">{formatPrice(item.price)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-[1.5] flex-col justify-between border-t border-gray-100 bg-gray-50/50 p-5 md:border-l md:border-t-0">
                                                                <div className="mb-4">
                                                                    <p className="text-xs text-gray-400">Total Belanja</p>
                                                                    <p className="text-xl font-extrabold text-[#1E3A8A]">{formatPrice(order.total)}</p>
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <Link href={`/customer/orders/${order.id}/payment`}>
                                                                        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#10B981] py-2 text-sm font-bold text-white shadow-sm hover:bg-[#10B981]/90">
                                                                            <CreditCard className="size-4" /> Bayar Sekarang
                                                                        </button>
                                                                    </Link>
                                                                    <Link href={`/customer/orders/${order.id}`}>
                                                                        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-bold text-[#1E3A8A] hover:bg-gray-50">
                                                                            <Eye className="size-4" /> Detail Transaksi
                                                                        </button>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </>
                        )}

                        {/* ── Ulasan ── */}
                        {activeSection === 'ulasan' && (
                            <>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg mb-4">Ulasan Saya</h3>
                                    <div className="flex h-12 w-full items-stretch overflow-hidden rounded-lg bg-[#4648d4]/5">
                                        <div className="flex items-center justify-center pl-4 text-[#4648d4]">
                                            <Search className="size-5" />
                                        </div>
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="flex w-full min-w-0 flex-1 border-none bg-transparent px-4 py-2 text-base font-medium text-[#1E3A8A] placeholder:text-gray-400 focus:outline-none"
                                            placeholder="Cari pesanan, nomor invoice, atau nama produk..."
                                        />
                                    </div>
                                </div>

                                {(() => {
                                    const completed = filtered?.filter((o: any) => o.status === 'completed' && !o.has_review) || [];
                                    return completed.length === 0 ? (
                                        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                                            <Star className="size-12 mx-auto text-gray-300 mb-3" />
                                            <p className="text-slate-500">Belum ada pesanan yang selesai untuk diulas</p>
                                            <Link href="/stores" className="mt-4 inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                                                Mulai Belanja
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {completed.map((order: any) => (
                                                <div key={order.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                                                    <div className="flex flex-col">
                                                        <div className="flex flex-col p-5">
                                                            <div className="mb-4 flex items-center gap-3">
                                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{order.created_at}</span>
                                                                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                                                <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5">
                                                                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">Selesai</span>
                                                                </div>
                                                                <span className="hidden text-xs font-medium text-gray-500 sm:inline">{order.order_number}</span>
                                                            </div>
                                                            <div className="mb-2 flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-gray-700">{order.store_name}</p>
                                                                <span className="flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                                                                    <BadgeCheck className="size-3" /> UMKM
                                                                </span>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {order.items?.map((item: any, idx: number) => (
                                                                    <div key={item.id || idx} className="flex items-center gap-3 rounded-lg border border-gray-50 bg-gray-50/30 p-3">
                                                                        <div
                                                                            className="size-14 flex-shrink-0 rounded-lg border border-gray-100 bg-center bg-cover"
                                                                            style={{ backgroundImage: `url(${item.image_url || ''})`, backgroundColor: '#f0f0ff' }}
                                                                        >
                                                                            {!item.image_url && (
                                                                                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#4648d4]/30">
                                                                                    {item.product_name?.[0] || 'P'}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-sm font-semibold text-[#1E3A8A]">{item.product_name}</p>
                                                                                {item.variant_name && (
                                                                                    <p className="truncate text-xs text-gray-400">{item.variant_name}</p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex flex-shrink-0 items-center gap-3">
                                                                                <span className="text-xs text-gray-400">x{item.quantity}</span>
                                                                                <span className="text-sm font-bold text-[#1E3A8A]">{formatPrice(item.price)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                                                            <div className="mb-3 flex items-center gap-1">
                                                                <span className="text-sm font-medium text-gray-600 mr-2">Rating:</span>
                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                    <button
                                                                        key={s}
                                                                        type="button"
                                                                        onClick={() => setReviewRatings((prev) => ({ ...prev, [order.id]: prev[order.id] === s ? 0 : s }))}
                                                                    >
                                                                        <Star
                                                                            className={`size-6 transition-colors ${
                                                                                s <= (reviewRatings[order.id] || 0)
                                                                                    ? 'text-yellow-400 fill-yellow-400'
                                                                                    : 'text-gray-300'
                                                                            }`}
                                                                        />
                                                                    </button>
                                                                ))}
                                                                {reviewRatings[order.id] ? (
                                                                    <span className="ml-2 text-sm font-medium text-yellow-600">{reviewRatings[order.id]}/5</span>
                                                                ) : (
                                                                    <span className="ml-2 text-sm text-gray-400">Pilih rating</span>
                                                                )}
                                                            </div>
                                                            <textarea
                                                                rows={2}
                                                                placeholder="Tulis komentar ulasan (opsional)..."
                                                                value={reviewTexts[`comment-${order.id}`] || ''}
                                                                onChange={(e) => setReviewTexts((prev) => ({ ...prev, [`comment-${order.id}`]: e.target.value }))}
                                                                className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4]"
                                                            />
                                                            <div className="mt-3 flex items-center justify-between">
                                                                <p className="text-[11px] text-gray-400">
                                                                    {order.items?.length || 0} produk — total {formatPrice(order.total)}
                                                                </p>
                                                                <button
                                                                    onClick={() => {
                                                                        if (!reviewRatings[order.id]) return;
                                                                        setReviewSubmitting((prev) => ({ ...prev, [order.id]: true }));
                                                                        router.post(`/customer/orders/${order.id}/review`, {
                                                                            rating: reviewRatings[order.id],
                                                                            review: reviewTexts[`comment-${order.id}`] || '',
                                                                        }, {
                                                                            preserveScroll: true,
                                                                            preserveState: true,
                                                                            onSuccess: () => {
                                                                                setReviewRatings((prev) => {
                                                                                    const next = { ...prev };
                                                                                    delete next[order.id];
                                                                                    return next;
                                                                                });
                                                                                setReviewTexts((prev) => {
                                                                                    const next = { ...prev };
                                                                                    delete next[`comment-${order.id}`];
                                                                                    return next;
                                                                                });
                                                                            },
                                                                            onFinish: () => setReviewSubmitting((prev) => ({ ...prev, [order.id]: false })),
                                                                        });
                                                                    }}
                                                                    disabled={!reviewRatings[order.id]}
                                                                    className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors ${
                                                                        reviewRatings[order.id]
                                                                            ? 'bg-[#4648d4] hover:bg-[#3b3db8]'
                                                                            : 'bg-gray-300 cursor-not-allowed'
                                                                    }`}
                                                                >
                                                                    {reviewSubmitting[order.id] ? 'Mengirim...' : 'Kirim Ulasan'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </>
                        )}

                        {/* ── Chat ── */}
                        {activeSection === 'chat' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="text-center py-12">
                                    <MessageCircle className="size-16 mx-auto text-gray-300 mb-4" />
                                    <h3 className="font-bold text-lg text-slate-900 mb-2">Pesan & Chat</h3>
                                    <p className="text-sm text-slate-500 mb-6">Lihat percakapan Anda dengan para penjual</p>
                                    <Link href="/customer/conversations" className="inline-block px-6 py-2.5 bg-[#4648d4] text-white rounded-xl text-sm font-semibold hover:bg-[#3b3db8] transition-colors">
                                        Buka Chat
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* ── Pesan Bantuan ── */}
                        {activeSection === 'bantuan' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4">Pusat Bantuan</h3>
                                <div className="space-y-4">
                                    {[
                                        { q: 'Bagaimana cara melacak pesanan?', a: 'Anda dapat melacak pesanan melalui menu Daftar Transaksi atau halaman Pesanan Saya.' },
                                        { q: 'Bagaimana cara mengajukan komplain?', a: 'Silakan hubungi penjual melalui fitur Chat atau ajukan komplain melalui menu Pesanan Dikomplain.' },
                                        { q: 'Berapa lama proses pengembalian dana?', a: 'Proses refund biasanya memakan waktu 3-14 hari kerja tergantung metode pembayaran.' },
                                    ].map((faq, i) => (
                                        <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                                            <summary className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-gray-50 transition-colors">
                                                {faq.q}
                                                <ChevronRight className="size-4 text-slate-400 group-open:rotate-90 transition-transform" />
                                            </summary>
                                            <div className="px-4 py-3 text-xs text-slate-500 border-t border-gray-100 bg-gray-50/50">
                                                {faq.a}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Pesanan Dikomplain ── */}
                        {activeSection === 'komplain' && (
                            <>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4">Pesanan Dikomplain</h3>
                                <div className="flex h-12 w-full items-stretch overflow-hidden rounded-lg bg-[#4648d4]/5">
                                    <div className="flex items-center justify-center pl-4 text-[#4648d4]">
                                        <Search className="size-5" />
                                    </div>
                                    <input
                                        value={complaintSearch}
                                        onChange={(e) => setComplaintSearch(e.target.value)}
                                        className="flex w-full min-w-0 flex-1 border-none bg-transparent px-4 py-2 text-base font-medium text-[#1E3A8A] placeholder:text-gray-400 focus:outline-none"
                                        placeholder="Cari pesanan atau produk..."
                                    />
                                </div>
                            </div>
                            {(() => {
                                const statusStyles: Record<string, string> = {
                                    pending: 'bg-yellow-50 text-yellow-600',
                                    resolved: 'bg-emerald-50 text-emerald-600',
                                    rejected: 'bg-red-50 text-red-500',
                                };
                                const statusLabels: Record<string, string> = {
                                    pending: 'Menunggu',
                                    resolved: 'Selesai',
                                    rejected: 'Ditolak',
                                };

                                const list = complaints?.data?.filter((c: any) => {
                                    if (complaintFilter && c.status !== complaintFilter) return false;
                                    if (complaintSearch) {
                                        const q = complaintSearch.toLowerCase();
                                        return c.order_number.toLowerCase().includes(q)
                                            || c.store_name.toLowerCase().includes(q)
                                            || c.items?.some((i: any) => i.product_name.toLowerCase().includes(q));
                                    }
                                    return true;
                                }) || [];

                                const completedOrders = orders?.data?.filter(
                                    (o: any) => o.status === 'completed' && !complaints?.data?.some((c: any) => c.order_id === o.id)
                                ) || [];

                                return (
                                    <div className="space-y-6">
                                        {list.length === 0 && completedOrders.length === 0 ? (
                                            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                                                <AlertTriangle className="size-12 mx-auto text-gray-300 mb-3" />
                                                <p className="text-slate-500">Belum ada komplain</p>
                                            </div>
                                        ) : null}

                                        {list.length > 0 && (
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                                <div className="flex flex-wrap gap-2 p-5 pb-0">
                                                    {[
                                                        { key: '', label: 'Semua' },
                                                        { key: 'pending', label: 'Menunggu' },
                                                        { key: 'resolved', label: 'Selesai' },
                                                        { key: 'rejected', label: 'Ditolak' },
                                                    ].map((f) => (
                                                        <button
                                                            key={f.key}
                                                            onClick={() => setComplaintFilter(f.key)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                                complaintFilter === f.key
                                                                    ? 'bg-[#4648d4] text-white shadow-sm'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            {f.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="p-5 space-y-4">
                                                    {list.map((c: any) => (
                                                        <div key={c.id} className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                                            <div className="flex flex-col">
                                                                <div className="p-5 pb-3">
                                                                    <div className="mb-3 flex items-center gap-3">
                                                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{c.created_at}</span>
                                                                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[c.status] || 'bg-gray-100 text-gray-600'}`}>
                                                                            {statusLabels[c.status] || c.status}
                                                                        </span>
                                                                        <span className="text-xs font-medium text-gray-500">{c.order_number}</span>
                                                                    </div>
                                                                    <div className="mb-2 flex items-center gap-2">
                                                                        <p className="text-sm font-semibold text-gray-700">{c.store_name}</p>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {c.items?.map((item: any, idx: number) => (
                                                                            <div key={idx} className="flex items-center gap-3 rounded-lg bg-gray-50/50 p-2">
                                                                                <div
                                                                                    className="size-10 flex-shrink-0 rounded-lg border border-gray-100 bg-center bg-cover"
                                                                                    style={{ backgroundImage: `url(${item.image_url || ''})`, backgroundColor: '#f0f0ff' }}
                                                                                >
                                                                                    {!item.image_url && (
                                                                                        <div className="flex h-full w-full items-center justify-center text-base font-bold text-[#4648d4]/30">
                                                                                            {item.product_name?.[0] || 'P'}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                                                    <div className="min-w-0">
                                                                                        <p className="truncate text-sm font-semibold text-[#1E3A8A]">{item.product_name}</p>
                                                                                        {item.variant_name && <p className="truncate text-[10px] text-gray-400">{item.variant_name}</p>}
                                                                                    </div>
                                                                                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                                                                    <div className="flex items-start gap-2 mb-3">
                                                                        <div className="rounded-full bg-red-100 p-1.5">
                                                                            <AlertTriangle className="size-3.5 text-red-500" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                                                {c.reason_label}
                                                                            </p>
                                                                            <p className="text-sm text-gray-700 mt-0.5">{c.description}</p>
                                                                        </div>
                                                                    </div>

                                                                    {c.status === 'pending' && (
                                                                        <button
                                                                            onClick={() => {
                                                                                if (confirm('Batalkan komplain ini?')) {
                                                                                    router.delete(`/customer/complaints/${c.id}`, {
                                                                                        preserveScroll: true,
                                                                                        preserveState: true,
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600"
                                                                        >
                                                                            Batalkan Komplain
                                                                        </button>
                                                                    )}

                                                                    {c.status === 'resolved' && c.resolution && (
                                                                        <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                                                                            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Resolusi</p>
                                                                            <p className="text-sm text-gray-700 mt-0.5">{c.resolution}</p>
                                                                        </div>
                                                                    )}

                                                                    {c.status === 'rejected' && c.resolution && (
                                                                        <div className="mt-2 rounded-lg bg-red-50 border border-red-100 p-3">
                                                                            <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">Alasan Ditolak</p>
                                                                            <p className="text-sm text-gray-700 mt-0.5">{c.resolution}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {completedOrders.length > 0 && (
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                                <h4 className="text-sm font-bold text-slate-900 mb-4">Ajukan Komplain</h4>
                                                <p className="text-xs text-slate-500 mb-4">
                                                    Pilih pesanan selesai yang ingin dikomplain
                                                </p>
                                                <div className="space-y-3">
                                                    {completedOrders.map((o: any) => (
                                                        <div key={o.id} className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                                            <div className="p-4">
                                                                <div className="mb-2 flex items-center gap-2">
                                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{o.created_at}</span>
                                                                    <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                                                    <span className="text-xs font-medium text-gray-500">{o.order_number}</span>
                                                                </div>
                                                                <p className="text-sm font-semibold text-gray-700">{o.store_name}</p>
                                                                <div className="mt-2 space-y-2">
                                                                    {o.items?.map((item: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center gap-3">
                                                                            <div
                                                                                className="size-10 flex-shrink-0 rounded-lg border border-gray-100 bg-center bg-cover"
                                                                                style={{ backgroundImage: `url(${item.image_url || ''})`, backgroundColor: '#f0f0ff' }}
                                                                            >
                                                                                {!item.image_url && (
                                                                                    <div className="flex h-full w-full items-center justify-center text-base font-bold text-[#4648d4]/30">
                                                                                        {item.product_name?.[0] || 'P'}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                                                <div className="min-w-0">
                                                                                    <p className="truncate text-sm font-semibold text-[#1E3A8A]">{item.product_name}</p>
                                                                                    {item.variant_name && <p className="truncate text-[10px] text-gray-400">{item.variant_name}</p>}
                                                                                </div>
                                                                                <span className="text-xs text-gray-400">x{item.quantity}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {showComplaintForm === o.id ? (
                                                                <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
                                                                    <select
                                                                        value={complaintReason}
                                                                        onChange={(e) => setComplaintReason(e.target.value)}
                                                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] outline-none"
                                                                    >
                                                                        <option value="wrong_product">Produk Tidak Sesuai</option>
                                                                        <option value="damaged">Produk Rusak</option>
                                                                        <option value="not_received">Pesanan Belum Diterima</option>
                                                                        <option value="other">Lainnya</option>
                                                                    </select>
                                                                    <textarea
                                                                        rows={3}
                                                                        placeholder="Jelaskan masalah Anda..."
                                                                        value={complaintDesc}
                                                                        onChange={(e) => setComplaintDesc(e.target.value)}
                                                                        className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4]"
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                if (!complaintDesc.trim()) return;
                                                                                setComplaintSubmitting(true);
                                                                                router.post('/customer/complaints', {
                                                                                    order_id: o.id,
                                                                                    reason: complaintReason,
                                                                                    description: complaintDesc,
                                                                                }, {
                                                                                    preserveScroll: true,
                                                                                    preserveState: true,
                                                                                    onSuccess: () => {
                                                                                        setShowComplaintForm(null);
                                                                                        setComplaintDesc('');
                                                                                        setComplaintReason('wrong_product');
                                                                                    },
                                                                                    onFinish: () => setComplaintSubmitting(false),
                                                                                });
                                                                            }}
                                                                            disabled={!complaintDesc.trim() || complaintSubmitting}
                                                                            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                                                                                complaintDesc.trim() && !complaintSubmitting
                                                                                    ? 'bg-red-500 hover:bg-red-600'
                                                                                    : 'bg-gray-300 cursor-not-allowed'
                                                                            }`}
                                                                        >
                                                                            {complaintSubmitting ? 'Mengirim...' : 'Kirim Komplain'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setShowComplaintForm(null); setComplaintDesc(''); }}
                                                                            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                                                        >
                                                                            Batal
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                                                                    <button
                                                                        onClick={() => {
                                                                            setShowComplaintForm(o.id);
                                                                            setComplaintReason('wrong_product');
                                                                            setComplaintDesc('');
                                                                        }}
                                                                        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600"
                                                                    >
                                                                        <AlertTriangle className="size-3.5" />
                                                                        Ajukan Komplain
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            </>
                        )}

                        {/* ── Pengaturan ── */}
                        {activeSection === 'pengaturan' && (
                            <>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg mb-4">Pengaturan</h3>

                                    <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
                                    {[
                                        { key: 'biodata', label: 'Biodata', icon: User },
                                        { key: 'alamat', label: 'Alamat', icon: MapPin },
                                        { key: 'rekening', label: 'Rekening Bank', icon: Building },
                                        { key: 'password', label: 'Ganti Password', icon: KeyRound },
                                    ].map((tab) => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setSettingsSection(tab.key)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                                    settingsSection === tab.key
                                                        ? 'bg-[#4648d4] text-white shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                <tab.icon className="size-4" />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                {/* Biodata */}
                                {settingsSection === 'biodata' && (
                                    <BiodataForm user={auth?.user} customer={auth?.user?.customer} />
                                )}

                                {/* Alamat */}
                                {settingsSection === 'alamat' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-sm text-slate-900">Alamat Tersimpan</h4>
                                            {!showAddressForm && (
                                                <button onClick={() => { setEditingAddress(null); setShowAddressForm(true); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4648d4] text-white rounded-lg text-xs font-semibold hover:bg-[#3b3db8] transition-colors"
                                                >
                                                    <Plus className="size-3.5" /> Tambah
                                                </button>
                                            )}
                                        </div>

                                        {showAddressForm && (
                                            <div className="mb-4">
                                                <AddressForm
                                                    address={editingAddress}
                                                    onCancel={() => { setShowAddressForm(false); setEditingAddress(null); }}
                                                    onSubmit={(data) => {
                                                        const isEdit = !!editingAddress;
                                                        const url = isEdit ? `/customer/address/${editingAddress.id}` : '/customer/address';
                                                        const method = isEdit ? 'put' : 'post';
                                                        router[method](url, { ...data, is_default: data.is_default ? 1 : 0 });
                                                        setShowAddressForm(false);
                                                        setEditingAddress(null);
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {!showAddressForm && (!addresses || addresses.length === 0) ? (
                                            <div className="text-center py-8">
                                                <MapPin className="size-10 mx-auto text-gray-300 mb-2" />
                                                <p className="text-sm text-slate-500">Belum ada alamat tersimpan</p>
                                            </div>
                                        ) : !showAddressForm ? (
                                            <div className="space-y-3">
                                                {addresses.map((addr: Address) => (
                                                    <div key={addr.id} className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    {addr.label && <span className="text-[10px] font-bold text-[#4648d4] bg-[#eef0ff] px-2 py-0.5 rounded-full uppercase">{addr.label}</span>}
                                                                    {addr.is_default && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="size-3" /> Utama</span>}
                                                                </div>
                                                                <p className="font-semibold text-sm text-slate-900">{addr.recipient_name}</p>
                                                                <p className="text-xs text-slate-500">{addr.phone}</p>
                                                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{addr.address}, {addr.city}, {addr.province}{addr.postal_code ? ` ${addr.postal_code}` : ''}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button onClick={() => { setEditingAddress(addr); setShowAddressForm(true); }} className="p-1.5 text-gray-400 hover:text-[#4648d4] hover:bg-[#eef0ff] rounded-lg transition-colors" title="Edit"><Pencil className="size-3.5" /></button>
                                                                <button onClick={() => setShowDeleteConfirm(addr.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 className="size-3.5" /></button>
                                                            </div>
                                                        </div>
                                                        {!addr.is_default && <button onClick={() => router.put(`/customer/address/${addr.id}`, { ...addr, is_default: 1 })} className="mt-2 text-xs text-[#4648d4] font-medium hover:underline">Jadikan Alamat Utama</button>}
                                                        {showDeleteConfirm === addr.id && (
                                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                                                                <p className="text-xs text-slate-500">Hapus alamat ini?</p>
                                                                <button onClick={() => { router.delete(`/customer/address/${addr.id}`); setShowDeleteConfirm(null); }} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors">Ya, Hapus</button>
                                                                <button onClick={() => setShowDeleteConfirm(null)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors">Batal</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* Rekening Bank */}
                                {settingsSection === 'rekening' && (
                                    <BankAccountSection accounts={bankAccounts || []} />
                                )}

                                {/* Ganti Password */}
                                {settingsSection === 'password' && <PasswordForm />}

                                
                            </div>
                        </>
                        )}

                        {/* ── Notifications ── */}
                        {activeSection === 'notifications' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg">Notifikasi</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs text-slate-500">{unreadCount} belum dibaca</span>
                                    )}
                                </div>
                                {(!notifications || notifications.length === 0) ? (
                                    <div className="text-center py-12">
                                        <Bell className="size-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-slate-500">Belum ada notifikasi</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {notifications.map((n: any) => (
                                            <div key={n.id} className={`p-4 rounded-xl border ${n.read_at ? 'border-gray-100' : 'border-[#4648d4] bg-[#eef0ff]'} transition-colors`}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-900">{n.data?.message || n.type}</p>
                                                        {n.data?.description && (
                                                            <p className="text-xs text-slate-500 mt-1">{n.data.description}</p>
                                                        )}
                                                        <p className="text-[10px] text-slate-400 mt-2">{n.created_at}</p>
                                                    </div>
                                                    {!n.read_at && (
                                                        <span className="w-2 h-2 bg-[#4648d4] rounded-full shrink-0 mt-2"></span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Wishlist ── */}
                        {activeSection === 'wishlist' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4">Wishlist</h3>
                                <div className="text-center py-12">
                                    <Heart className="size-12 mx-auto text-gray-300 mb-3" />
                                    <p className="text-slate-500">Belum ada produk yang ditambahkan ke wishlist</p>
                                    <Link href="/stores" className="mt-4 inline-block px-6 py-2.5 bg-[#4648d4] text-white rounded-xl text-sm font-semibold hover:bg-[#3b3db8] transition-colors">
                                        Mulai Belanja
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
