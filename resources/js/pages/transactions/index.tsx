'use client';

import { Head, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Banknote,
    Receipt,
    Package,
    CheckCircle2,
    Bell,
    ChevronRight,
    Ticket,
    X,
    User,
    TicketPercent,
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Receipt as ReceiptComponent } from '@/components/receipt';
import { useUsbPrint } from '@/hooks/use-usb-print';
import { buildReceipt } from '@/lib/escpos';

import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import VisuallyHidden from '@/components/ui/visually-hidden';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import posRoute from '@/routes/pos';
import printRoute from '@/routes/print';
import vouchersRoute from '@/routes/vouchers';

interface ProductVariant {
    id: number;
    name: string;
    additional_price: number;
}

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    image: string | null;
    description?: string;
    category: { name: string };
    variants?: ProductVariant[];
}

interface CartItem extends Product {
    cartKey: string;
    quantity: number;
    selectedVariant?: ProductVariant | null;
}

// ─── Pill selector ────────────────────────────────────────────────────────────

function PillGroup({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
                {label}
            </p>
            <div className="flex flex-wrap gap-1">
                {options.map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                            value === opt
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/60'
                        }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
    product,
    isOpen,
    productOptions,
    setProductOptions,
    onCardClick,
    onAddToCart,
    fmt,
}: {
    product: Product;
    isOpen: boolean;
    productOptions: { variantId: number | null; qty: number };
    setProductOptions: React.Dispatch<
        React.SetStateAction<{ variantId: number | null; qty: number }>
    >;
    onCardClick: () => void;
    onAddToCart: (qty: number) => void;
    fmt: (v: number) => string;
}) {
    return (
        <div
            className={`overflow-hidden rounded-2xl border bg-card transition-all duration-200 ${
                isOpen
                    ? 'border-primary/40 shadow-md'
                    : 'cursor-pointer border-border hover:border-border/80 hover:shadow-sm'
            }`}
        >
            {/* ── Top section: nama + harga ── */}
            <div
                className="flex cursor-pointer items-center justify-between px-4 pt-3.5 pb-1"
                onClick={onCardClick}
            >
                <h3 className="text-[13px] leading-tight font-semibold text-card-foreground">
                    {product.name}
                </h3>
                <span className="ml-3 shrink-0 text-[13px] font-bold text-primary">
                    {fmt(product.price)}
                </span>
            </div>

            {/* ── Middle: gambar + deskripsi ── */}
            <div
                className="flex cursor-pointer items-start gap-3 px-4 pb-3.5"
                onClick={onCardClick}
            >
                {/* Thumbnail */}
                <div className="mt-1 size-[70px] shrink-0 overflow-hidden rounded-xl bg-muted">
                    {product.image ? (
                        <img
                            src={`/storage/${product.image}`}
                            alt={product.name}
                            className="size-full object-cover"
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                            <Package className="size-6" />
                        </div>
                    )}
                </div>

                {/* Deskripsi */}
                <p className="mt-0.5 line-clamp-3 flex-1 text-[11.5px] leading-relaxed text-muted-foreground">
                    {product.description ??
                        `${product.category.name} — stok: ${product.stock}`}
                </p>
            </div>

            {/* ── Expanded: options + add to cart ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        className="overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-3 border-t border-border bg-muted/40 px-4 pt-3 pb-4">
                            {/* Variants */}
                            {product.variants &&
                                product.variants.length > 0 && (
                                    <div className="space-y-1.5 pb-2">
                                        <p className="text-[11px] font-medium text-muted-foreground">
                                            Pilih Varian
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {product.variants.map((variant) => (
                                                <button
                                                    key={variant.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setProductOptions(
                                                            (p) => ({
                                                                ...p,
                                                                variantId:
                                                                    variant.id,
                                                            }),
                                                        )
                                                    }
                                                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                                                        productOptions.variantId ===
                                                        variant.id
                                                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                                            : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                                                    }`}
                                                >
                                                    {variant.name} (+
                                                    {fmt(
                                                        variant.additional_price,
                                                    )}
                                                    )
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {/* Qty + Add to Cart */}
                            <div className="flex items-center gap-2.5 pt-0.5">
                                {/* Qty control */}
                                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
                                    <button
                                        onClick={() =>
                                            setProductOptions((p) => ({
                                                ...p,
                                                qty: Math.max(1, p.qty - 1),
                                            }))
                                        }
                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <Minus className="size-3" />
                                    </button>
                                    <span className="w-5 text-center text-[12px] font-semibold text-foreground">
                                        {productOptions.qty}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setProductOptions((p) => ({
                                                ...p,
                                                qty: p.qty + 1,
                                            }))
                                        }
                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <Plus className="size-3" />
                                    </button>
                                </div>

                                {/* Add to cart button */}
                                <button
                                    onClick={() =>
                                        onAddToCart(productOptions.qty)
                                    }
                                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-[12px] font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
                                >
                                    <ShoppingCart className="size-3.5" />
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface PaymentMethod {
    id: number;
    name: string;
    type: string;
}

interface Customer {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    loyalty_points: number;
}

interface Props {
    products: Product[];
    paymentMethods: PaymentMethod[];
    customers: Customer[];
    promotionText?: string;
}

export default function POS({
    products,
    paymentMethods = [],
    customers = [],
    promotionText = 'Enjoy 30% OFF on all your favorite drinks',
}: Props) {
    const page = usePage();
    const authUser = (page.props as any).auth?.user;
    const flashTransaction = (page.props as any).flash?.transaction;
    const tenant = (page.props as any).tenant;
    const POINT_VALUE = tenant?.point_value ?? 100;
    const MIN_REDEEM_POINTS = tenant?.min_redeem_points ?? 100;
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [expandedProductId, setExpandedProductId] = useState<number | null>(
        null,
    );
    const [productOptions, setProductOptions] = useState<{
        variantId: number | null;
        qty: number;
    }>({
        variantId: null,
        qty: 1,
    });
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [paidAmount, setPaidAmount] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState<number | ''>('');
    const [orderType, setOrderType] = useState('direct');
    const [manualTax, setManualTax] = useState('0');
    const [manualDiscount, setManualDiscount] = useState('0');
    const [lastTransaction, setLastTransaction] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        null,
    );
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<{
        id: number;
        code: string;
        name: string;
        discount: number;
    } | null>(null);
    const [voucherError, setVoucherError] = useState('');
    const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
    const [redeemPointsInput, setRedeemPointsInput] = useState('');
    const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [cartSheetOpen, setCartSheetOpen] = useState(false);
    const {
        print: usbPrint,
        isSupported: webUsbSupported,
        isPrinting: isWebUsbPrinting,
        deviceName: usbDeviceName,
    } = useUsbPrint();

    const allCustomers = useMemo(
        () => [...customers, ...localCustomers],
        [customers, localCustomers],
    );

    const filteredCustomers = useMemo(() => {
        const q = customerSearch.toLowerCase();

        return allCustomers.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.phone && c.phone.includes(q)) ||
                (c.email && c.email.toLowerCase().includes(q)),
        );
    }, [allCustomers, customerSearch]);

    const customerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                customerRef.current &&
                !customerRef.current.contains(e.target as Node)
            ) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateCustomer = async () => {
        const name = customerSearch.trim();
        if (!name) return;
        setIsCreatingCustomer(true);
        try {
            const token =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            const res = await fetch('/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ name, phone: '' }),
            });
            if (!res.ok) throw new Error('Gagal membuat pelanggan');
            const newCustomer: Customer = await res.json();
            setLocalCustomers((prev) => [...prev, newCustomer]);
            setSelectedCustomer(newCustomer);
            setShowCustomerDropdown(false);
            setCustomerSearch('');
            toast.success(`Pelanggan "${name}" berhasil dibuat`);
        } catch {
            toast.error('Gagal membuat pelanggan baru');
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    useEffect(() => {
        if (flashTransaction) {
            const pm = paymentMethods.find((pm) => pm.id === paymentMethodId);
            setLastTransaction({
                id: flashTransaction.id,
                transaction_code: flashTransaction.transaction_code,
                subtotal_amount: flashTransaction.subtotal_amount,
                tax_amount: flashTransaction.tax_amount,
                discount_amount: flashTransaction.discount_amount,
                total_amount: flashTransaction.total_amount,
                paid_amount: flashTransaction.paid_amount,
                change_amount: flashTransaction.change_amount,
                order_type: flashTransaction.order_type,
                user: authUser ? { name: authUser.name } : { name: 'Admin' },
                payment_method: pm ? { name: pm.name } : null,
                created_at: flashTransaction.created_at,
                details: cart.map((i) => ({
                    product_name: i.name,
                    product: { name: i.name },
                    price: i.price,
                    quantity: i.quantity,
                })),
                customer: selectedCustomer ?? null,
            });
            setIsPaymentModalOpen(false);
            setIsSuccessModalOpen(true);
            setCart([]);
            setPaidAmount('');
            setManualTax('0');
            setManualDiscount('0');
            setSelectedCustomer(null);
            setCustomerSearch('');
            setAppliedVoucher(null);
            setVoucherCode('');
            setVoucherError('');
            setRedeemPointsInput('');
            toast.success('Transaksi berhasil!');
        }
    }, [flashTransaction]);

    const printToPrinter = useCallback(
        async (driver = 'usb') => {
            const id = lastTransaction?.id;
            if (!id) {
                toast.error('Data transaksi tidak ditemukan');

                return;
            }
            if (isPrinting) return;
            setIsPrinting(true);
            const token =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            try {
                const url =
                    printRoute.receipt(id).url +
                    '?driver=' +
                    encodeURIComponent(driver);
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': token,
                        Accept: 'application/json',
                    },
                });
                const data = await res.json();
                if (data.success) {
                    toast.success(data.message || 'Struk berhasil dicetak');
                } else {
                    toast.error(data.message);
                }
            } catch (err: any) {
                toast.error(err?.message || 'Gagal mencetak struk');
            } finally {
                setIsPrinting(false);
            }
        },
        [lastTransaction, isPrinting],
    );

    const handleWebUsbPrint = useCallback(async () => {
        if (!lastTransaction) {
            toast.error('Data transaksi tidak ditemukan');
            return;
        }

        if (!webUsbSupported) {
            toast.error('WebUSB tidak didukung. Gunakan Chrome atau Edge.');
            return;
        }

        const storeData = {
            storeName: tenant?.name || 'TOKO',
            storeAddress: tenant?.address || '',
            storePhone: tenant?.phone || '',
            transactionCode: lastTransaction.transaction_code,
            date: lastTransaction.created_at
                ? new Date(lastTransaction.created_at).toLocaleString('id-ID')
                : new Date().toLocaleString('id-ID'),
            cashier: lastTransaction.user?.name || 'Admin',
            orderType:
                lastTransaction.order_type === 'service'
                    ? 'Service'
                    : lastTransaction.order_type === 'pre_order'
                      ? 'Pre-Order'
                      : 'Direct',
            paymentMethod: lastTransaction.payment_method?.name,
            customer: lastTransaction.customer?.name,
            details: (lastTransaction.details || []).map((d: any) => ({
                name: d.product_name || d.product?.name || 'Product',
                qty: d.quantity,
                total: d.price * d.quantity,
            })),
            subtotal: lastTransaction.subtotal_amount,
            discount: lastTransaction.discount_amount,
            tax: lastTransaction.tax_amount,
            total: lastTransaction.total_amount,
            paid: lastTransaction.paid_amount,
            change: lastTransaction.change_amount,
            footer:
                tenant?.settings?.receipt_footer || 'TERIMA KASIH',
        };

        try {
            const data = buildReceipt(storeData);
            await usbPrint(data);
            toast.success(
                usbDeviceName
                    ? `Struk berhasil dikirim ke ${usbDeviceName}`
                    : 'Struk berhasil dicetak',
            );
        } catch (err: any) {
            toast.error(err?.message || 'Gagal mencetak via USB');
        }
    }, [lastTransaction, tenant, webUsbSupported, usbPrint, usbDeviceName]);

    const categories = useMemo(() => {
        const cats = Array.from(
            new Set(products.map((p) => p.category?.name ?? 'Uncategorized')),
        );

        return ['All', ...cats];
    }, [products]);

    const filteredProducts = useMemo(
        () =>
            products.filter((p) => {
                const q = searchQuery.toLowerCase();

                return (
                    (p.name.toLowerCase().includes(q) ||
                        (p.category?.name ?? '').toLowerCase().includes(q)) &&
                    (activeCategory === 'All' ||
                        (p.category?.name ?? 'Uncategorized') ===
                            activeCategory)
                );
            }),
        [products, searchQuery, activeCategory],
    );

    const subtotal = useMemo(
        () => cart.reduce((a, i) => a + i.price * i.quantity, 0),
        [cart],
    );
    const tax = parseFloat(manualTax) || 0;
    const discount = parseFloat(manualDiscount) || 0;
    const voucherDiscount = appliedVoucher?.discount || 0;
    const maxRedeemPoints = selectedCustomer
        ? Math.floor(selectedCustomer.loyalty_points / MIN_REDEEM_POINTS) *
          MIN_REDEEM_POINTS
        : 0;
    const redeemedPoints = Math.min(
        Math.max(parseInt(redeemPointsInput) || 0, 0),
        maxRedeemPoints,
    );
    const pointDiscount =
        redeemedPoints >= MIN_REDEEM_POINTS ? redeemedPoints * POINT_VALUE : 0;
    const total = Math.max(
        0,
        subtotal + tax - discount - voucherDiscount - pointDiscount,
    );

    const fmt = (v: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(v);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleProductClick = (product: Product) => {
        if (expandedProductId === product.id) {
            setExpandedProductId(null);

            return;
        }

        setExpandedProductId(product.id);
        setProductOptions({
            variantId:
                product.variants && product.variants.length > 0
                    ? product.variants[0].id
                    : null,
            qty: 1,
        });
    };

    const addToCart = (product: Product, qty: number) => {
        const variant = productOptions.variantId
            ? product.variants?.find((v) => v.id === productOptions.variantId)
            : null;

        const pricePerUnit =
            product.price + (variant ? Number(variant.additional_price) : 0);

        const cartKey = `${product.id}-${variant?.id || 'base'}`;
        setCart((prev) => {
            const existing = prev.find((i) => i.cartKey === cartKey);

            if (existing) {
                if (existing.quantity + qty > product.stock) {
                    toast.error('Stok tidak cukup');

                    return prev;
                }

                return prev.map((i) =>
                    i.cartKey === cartKey
                        ? { ...i, quantity: i.quantity + qty }
                        : i,
                );
            }

            return [
                ...prev,
                {
                    ...product,
                    price: pricePerUnit,
                    cartKey,
                    quantity: qty,
                    selectedVariant: variant,
                },
            ];
        });
        setExpandedProductId(null);
        toast.success(`${product.name} ditambahkan`);
    };

    const updateQty = (cartKey: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.cartKey !== cartKey) {
                        return item;
                    }

                    const newQty = Math.max(0, item.quantity + delta);

                    if (delta > 0 && newQty > item.stock) {
                        toast.error('Stok tidak cukup');

                        return item;
                    }

                    return { ...item, quantity: newQty };
                })
                .filter((item) => item.quantity > 0),
        );
    };

    const removeCartItem = (cartKey: string) => {
        setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
    };

    const applyVoucher = async () => {
        if (!voucherCode.trim()) {
            return;
        }

        setIsValidatingVoucher(true);
        setVoucherError('');

        try {
            const token =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            const res = await fetch(vouchersRoute.validate().url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    code: voucherCode.trim(),
                    order_amount: subtotal + tax - discount,
                }),
            });
            const data = await res.json();

            if (data.valid) {
                setAppliedVoucher(data.voucher);
                setVoucherCode('');
            } else {
                setVoucherError(data.message || 'Voucher tidak valid');
                setAppliedVoucher(null);
            }
        } catch {
            setVoucherError('Gagal memvalidasi voucher');
        } finally {
            setIsValidatingVoucher(false);
        }
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        const paid = parseFloat(paidAmount);

        if (isNaN(paid) || paid < total) {
            toast.error('Pembayaran kurang');

            return;
        }

        if (!paymentMethodId) {
            toast.error('Pilih metode pembayaran');

            return;
        }

        setIsProcessing(true);
        const items = cart.map((i) => ({
            product_id: i.id,
            product_variant_id: i.selectedVariant?.id || null,
            variant_name: i.selectedVariant?.name || null,
            quantity: i.quantity,
            price: i.price,
        }));
        router.post(
            posRoute.store().url,
            {
                items,
                subtotal_amount: subtotal,
                tax_amount: tax,
                discount_amount: discount + voucherDiscount + pointDiscount,
                total_amount: total,
                paid_amount: paid,
                change_amount: paid - total,
                payment_method_id: paymentMethodId,
                order_type: orderType,
                customer_id: selectedCustomer?.id || null,
                voucher_id: appliedVoucher?.id || null,
                redeemed_points:
                    redeemedPoints >= MIN_REDEEM_POINTS ? redeemedPoints : 0,
            },
            {
                onError: (err) => toast.error(Object.values(err)[0] as string),
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Point of Sale" />

            <div
                className="flex flex-col overflow-hidden bg-muted"
                style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    height: 'calc(100dvh - 3.5rem)',
                }}
            >
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border bg-background px-3 py-2.5 md:px-5">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-all ${
                                        activeCategory === cat
                                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                            : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-4 md:px-5">
                            <div className="relative mb-3">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setExpandedProductId(null);
                                    }}
                                    placeholder="Cari produk atau kategori..."
                                    className="h-10 w-full rounded-xl border border-border bg-background pr-4 pl-9 text-[16px] transition-all outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary md:text-[13px]"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-[14px] font-bold text-foreground">
                                    {activeCategory === 'All'
                                        ? 'All Menu'
                                        : `${activeCategory} Menu`}
                                </h2>
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    {filteredProducts.length} menu result
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 2xl:grid-cols-3">
                                <AnimatePresence mode="popLayout">
                                    {filteredProducts.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.96 }}
                                            transition={{ duration: 0.14 }}
                                        >
                                            <ProductCard
                                                product={product}
                                                isOpen={
                                                    expandedProductId ===
                                                    product.id
                                                }
                                                productOptions={productOptions}
                                                setProductOptions={
                                                    setProductOptions
                                                }
                                                onCardClick={() =>
                                                    handleProductClick(product)
                                                }
                                                onAddToCart={(qty) =>
                                                    addToCart(product, qty)
                                                }
                                                fmt={fmt}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {filteredProducts.length === 0 && (
                                    <div className="col-span-1 flex flex-col items-center justify-center py-20 opacity-30 lg:col-span-2 2xl:col-span-3">
                                        <Package className="mb-2 size-10 text-muted-foreground" />
                                        <p className="text-[13px] font-bold text-muted-foreground">
                                            Produk tidak ditemukan
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="hidden h-full w-[270px] shrink-0 flex-col border-l border-border bg-card md:flex">
                        <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-1">
                            <h2 className="text-[14px] font-bold text-foreground">
                                Bills
                            </h2>
                            {cart.length > 0 && (
                                <button
                                    onClick={() => setCart([])}
                                    className="text-[11px] font-semibold text-red-400 transition-colors hover:text-red-600"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        <ScrollArea className="flex-1 px-4">
                            <div className="space-y-3 py-2">
                                <AnimatePresence initial={false}>
                                    {cart.length > 0 ? (
                                        cart.map((item) => (
                                            <motion.div
                                                key={item.cartKey}
                                                layout
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{
                                                    opacity: 0,
                                                    x: 12,
                                                    transition: {
                                                        duration: 0.1,
                                                    },
                                                }}
                                                className="flex items-start gap-2.5"
                                            >
                                                <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                                                    {item.image ? (
                                                        <img
                                                            src={`/storage/${item.image}`}
                                                            className="size-full object-cover"
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center text-muted-foreground">
                                                            <Package className="size-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-1">
                                                        <p className="truncate text-[12px] leading-tight font-bold text-foreground">
                                                            {item.name}
                                                        </p>
                                                        <p className="shrink-0 text-[12px] font-bold whitespace-nowrap text-foreground">
                                                            {fmt(
                                                                item.price *
                                                                    item.quantity,
                                                            )}
                                                        </p>
                                                    </div>
                                                    {item.selectedVariant && (
                                                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                                            Variant:{' '}
                                                            {
                                                                item
                                                                    .selectedVariant
                                                                    .name
                                                            }
                                                        </p>
                                                    )}
                                                    <div className="mt-1.5 flex items-center gap-1.5">
                                                        <div className="flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5">
                                                            <button
                                                                onClick={() =>
                                                                    updateQty(
                                                                        item.cartKey,
                                                                        -1,
                                                                    )
                                                                }
                                                                className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                                                            >
                                                                <Minus className="size-2.5" />
                                                            </button>
                                                            <span className="w-4 text-center text-[11px] font-bold">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    updateQty(
                                                                        item.cartKey,
                                                                        1,
                                                                    )
                                                                }
                                                                className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                                                            >
                                                                <Plus className="size-2.5" />
                                                            </button>
                                                        </div>
                                                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                            Notes
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="flex h-40 flex-col items-center justify-center opacity-30">
                                            <ShoppingCart className="mb-2 size-8 text-muted-foreground" />
                                            <p className="text-[12px] font-bold text-muted-foreground">
                                                Keranjang kosong
                                            </p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </ScrollArea>

                        {/* Summary */}
                        <div className="shrink-0 space-y-1.5 border-t border-dashed border-border px-4 py-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-muted-foreground">
                                    Sub Total
                                </span>
                                <span className="text-[12px] font-semibold text-foreground">
                                    {fmt(subtotal)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-muted-foreground">
                                    Tax
                                </span>
                                <CurrencyInput
                                    value={manualTax}
                                    onChange={setManualTax}
                                    prefix=""
                                    className="h-7 w-20 rounded border-none bg-transparent px-1 py-0.5 text-right text-[12px] font-semibold text-foreground focus:bg-muted focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-muted-foreground">
                                    Discount
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <span className="text-[12px] text-muted-foreground">
                                        -
                                    </span>
                                    <CurrencyInput
                                        value={manualDiscount}
                                        onChange={setManualDiscount}
                                        prefix=""
                                        className="h-7 w-20 rounded border-none bg-transparent px-1 py-0.5 text-right text-[12px] font-semibold text-foreground focus:bg-muted focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-dashed border-border pt-2">
                                <span className="text-[14px] font-bold text-foreground">
                                    Total
                                </span>
                                <span className="text-[14px] font-black text-foreground">
                                    {fmt(total)}
                                </span>
                            </div>
                        </div>

                        {/* Promo */}
                        <div className="mx-4 mb-3 flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-muted p-2.5 transition-colors hover:bg-accent">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card shadow-sm">
                                <Ticket className="size-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] leading-tight font-black text-foreground"></p>
                                <p className="truncate text-[9px] text-muted-foreground">
                                    {promotionText}
                                </p>
                            </div>
                            <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                        </div>

                        {/* Checkout */}
                        <div className="shrink-0 px-4 pb-4">
                            <button
                                disabled={cart.length === 0}
                                onClick={() => {
                                    setPaidAmount(total.toString());
                                    setIsPaymentModalOpen(true);
                                }}
                                className="h-11 w-full rounded-xl bg-primary text-[13px] font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── MOBILE BOTTOM BAR ── */}
                <div className="flex shrink-0 items-center gap-3 border-t border-border bg-card px-4 py-3 shadow-lg md:hidden">
                    <button
                        onClick={() => setCartSheetOpen(true)}
                        className="relative flex items-center gap-2"
                    >
                        <ShoppingCart className="size-5 text-foreground" />
                        {cart.length > 0 && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {cart.length}
                            </span>
                        )}
                    </button>

                    <div className="flex-1 text-right">
                        <p className="text-[11px] text-muted-foreground">
                            Total
                        </p>
                        <p className="text-[15px] font-black text-foreground">
                            {fmt(total)}
                        </p>
                    </div>

                    <button
                        disabled={cart.length === 0}
                        onClick={() => {
                            setPaidAmount(total.toString());
                            setIsPaymentModalOpen(true);
                        }}
                        className="h-11 flex-1 rounded-xl bg-primary text-[13px] font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Checkout
                    </button>
                </div>
            </div>

            {/* ── MOBILE CART SHEET ── */}
            <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
                <SheetContent
                    side="bottom"
                    className="flex h-full max-h-full flex-col rounded-t-none p-0"
                    showCloseButton={false}
                >
                    <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-[14px] font-bold">
                                Bills
                            </SheetTitle>
                            {cart.length > 0 && (
                                <button
                                    onClick={() => setCart([])}
                                    className="text-[11px] font-semibold text-red-400 transition-colors hover:text-red-600"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-4">
                        <div className="space-y-3 py-3">
                            {cart.length > 0 ? (
                                <AnimatePresence initial={false}>
                                    {cart.map((item) => (
                                        <motion.div
                                            key={item.cartKey}
                                            layout
                                            initial={{ opacity: 0, x: 12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{
                                                opacity: 0,
                                                x: 12,
                                                transition: { duration: 0.1 },
                                            }}
                                            className="group relative flex items-start gap-2.5 rounded-xl bg-card"
                                        >
                                            <button
                                                onClick={() =>
                                                    removeCartItem(item.cartKey)
                                                }
                                                className="absolute top-0 right-0 z-10 flex size-7 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                                            >
                                                <X />
                                            </button>
                                            <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                                                {item.image ? (
                                                    <img
                                                        src={`/storage/${item.image}`}
                                                        className="size-full object-cover"
                                                        alt=""
                                                    />
                                                ) : (
                                                    <div className="flex size-full items-center justify-center text-muted-foreground">
                                                        <Package className="size-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-1">
                                                    <p className="truncate text-[12px] leading-tight font-bold text-foreground">
                                                        {item.name}
                                                    </p>
                                                    <p className="shrink-0 text-[12px] font-bold whitespace-nowrap text-foreground">
                                                        {fmt(
                                                            item.price *
                                                                item.quantity,
                                                        )}
                                                    </p>
                                                </div>
                                                {item.selectedVariant && (
                                                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                                        Variant:{' '}
                                                        {
                                                            item.selectedVariant
                                                                .name
                                                        }
                                                    </p>
                                                )}
                                                <div className="mt-1.5 flex items-center gap-1.5">
                                                    <div className="flex items-center gap-0.5 rounded-md border border-border px-1 py-0.5">
                                                        <button
                                                            onClick={() =>
                                                                updateQty(
                                                                    item.cartKey,
                                                                    -1,
                                                                )
                                                            }
                                                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground active:bg-accent"
                                                        >
                                                            <Minus className="size-3" />
                                                        </button>
                                                        <span className="w-6 text-center text-[12px] font-bold">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateQty(
                                                                    item.cartKey,
                                                                    1,
                                                                )
                                                            }
                                                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground active:bg-accent"
                                                        >
                                                            <Plus className="size-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            ) : (
                                <div className="flex h-40 flex-col items-center justify-center opacity-30">
                                    <ShoppingCart className="mb-2 size-8 text-muted-foreground" />
                                    <p className="text-[12px] font-bold text-muted-foreground">
                                        Keranjang kosong
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="shrink-0 space-y-1.5 border-t border-dashed border-border px-4 py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] text-muted-foreground">
                                Sub Total
                            </span>
                            <span className="text-[12px] font-semibold text-foreground">
                                {fmt(subtotal)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] text-muted-foreground">
                                Tax
                            </span>
                            <CurrencyInput
                                value={manualTax}
                                onChange={setManualTax}
                                prefix=""
                                className="h-7 w-20 rounded border-none bg-transparent px-1 py-0.5 text-right text-[12px] font-semibold text-foreground focus:bg-muted focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] text-muted-foreground">
                                Discount
                            </span>
                            <div className="flex items-center gap-0.5">
                                <span className="text-[12px] text-muted-foreground">
                                    -
                                </span>
                                <CurrencyInput
                                    value={manualDiscount}
                                    onChange={setManualDiscount}
                                    prefix=""
                                    className="h-7 w-20 rounded border-none bg-transparent px-1 py-0.5 text-right text-[12px] font-semibold text-foreground focus:bg-muted focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-dashed border-border pt-2">
                            <span className="text-[14px] font-bold text-foreground">
                                Total
                            </span>
                            <span className="text-[14px] font-black text-foreground">
                                {fmt(total)}
                            </span>
                        </div>
                    </div>

                    <div className="shrink-0 px-4 pb-4">
                        <button
                            disabled={cart.length === 0}
                            onClick={() => {
                                setCartSheetOpen(false);
                                setTimeout(() => {
                                    setPaidAmount(total.toString());
                                    setIsPaymentModalOpen(true);
                                }, 200);
                            }}
                            className="h-11 w-full rounded-xl bg-primary text-[13px] font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Checkout
                        </button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* ── PAYMENT MODAL ── */}
            <Dialog
                open={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
            >
                <DialogContent
                    className="flex flex-col border-none bg-card p-0 shadow-2xl max-sm:top-0 max-sm:left-0 max-sm:h-full max-sm:max-h-dvh max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none sm:max-h-[90vh] sm:max-w-[480px] sm:rounded-[1.5rem] lg:max-w-[520px]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                    <form
                        onSubmit={handlePayment}
                        className="flex h-full flex-col overflow-hidden"
                    >
                        <div className="flex-1 space-y-5 overflow-y-auto p-5 pb-0 sm:p-7 sm:pb-0">
                            <DialogHeader>
                                <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 sm:size-14">
                                    <Banknote className="size-6 text-primary sm:size-7" />
                                </div>
                                <DialogTitle className="text-lg font-black sm:text-xl">
                                    Pembayaran
                                </DialogTitle>
                                <DialogDescription className="text-[13px]">
                                    Konfirmasi pembayaran dari pelanggan.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 rounded-xl border border-border bg-muted p-4 sm:p-5">
                                {[
                                    ['Subtotal', fmt(subtotal)],
                                    ['Tax', `+${fmt(tax)}`],
                                    ['Discount', `-${fmt(discount)}`],
                                ].map(([l, v]) => (
                                    <div
                                        key={l}
                                        className="flex justify-between text-[12px]"
                                    >
                                        <span className="text-muted-foreground">
                                            {l}
                                        </span>
                                        <span
                                            className={`font-bold ${l === 'Discount' ? 'text-red-500' : ''}`}
                                        >
                                            {v}
                                        </span>
                                    </div>
                                ))}
                                {voucherDiscount > 0 && (
                                    <div className="flex justify-between text-[12px]">
                                        <span className="text-muted-foreground">
                                            Voucher
                                        </span>
                                        <span className="font-bold text-red-500">
                                            -{fmt(voucherDiscount)}
                                        </span>
                                    </div>
                                )}
                                {pointDiscount > 0 && (
                                    <div className="flex justify-between text-[12px]">
                                        <span className="text-muted-foreground">
                                            Poin
                                        </span>
                                        <span className="font-bold text-red-500">
                                            -{fmt(pointDiscount)}
                                        </span>
                                    </div>
                                )}
                                <Separator className="my-1" />
                                <div className="flex justify-between">
                                    <span className="text-[13px] font-bold">
                                        Total
                                    </span>
                                    <span className="text-[15px] font-black text-primary">
                                        {fmt(total)}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Tipe Transaksi
                                </Label>
                                <select
                                    value={orderType}
                                    onChange={(e) =>
                                        setOrderType(e.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-primary"
                                >
                                    <option value="direct">
                                        Direct (Pembelian Langsung)
                                    </option>
                                    <option value="service">
                                        Service (Perbaikan)
                                    </option>
                                    <option value="pre_order">
                                        Pre-Order (Inden)
                                    </option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Pelanggan
                                </Label>
                                <div className="relative" ref={customerRef}>
                                    {selectedCustomer ? (
                                        <div className="flex h-11 items-center justify-between rounded-xl border border-border bg-background px-3">
                                            <div className="flex items-center gap-2">
                                                <User className="size-4 text-muted-foreground" />
                                                <span className="text-[13px] font-semibold text-foreground">
                                                    {selectedCustomer.name}
                                                </span>
                                                {selectedCustomer.phone && (
                                                    <span className="text-[11px] text-muted-foreground">
                                                        •{' '}
                                                        {selectedCustomer.phone}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCustomer(null);
                                                    setCustomerSearch('');
                                                }}
                                                className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={customerSearch}
                                                onChange={(e) => {
                                                    setCustomerSearch(
                                                        e.target.value,
                                                    );
                                                    setShowCustomerDropdown(
                                                        true,
                                                    );
                                                }}
                                                onFocus={() =>
                                                    setShowCustomerDropdown(
                                                        true,
                                                    )
                                                }
                                                placeholder="Cari nama/no. telepon..."
                                                className="h-11 w-full rounded-xl border border-border bg-background pr-3 pl-9 text-[13px] outline-none focus:border-primary focus:ring-primary"
                                            />
                                            {showCustomerDropdown &&
                                                customerSearch && (
                                                    <div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
                                                        {filteredCustomers.length >
                                                        0 ? (
                                                            filteredCustomers.map(
                                                                (c) => (
                                                                    <button
                                                                        key={
                                                                            c.id
                                                                        }
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedCustomer(
                                                                                c,
                                                                            );
                                                                            setShowCustomerDropdown(
                                                                                false,
                                                                            );
                                                                            setCustomerSearch(
                                                                                '',
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                                                                    >
                                                                        <User className="size-4 shrink-0 text-muted-foreground" />
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-[13px] font-semibold text-foreground">
                                                                                {
                                                                                    c.name
                                                                                }
                                                                            </p>
                                                                            {c.phone && (
                                                                                <p className="truncate text-[11px] text-muted-foreground">
                                                                                    {
                                                                                        c.phone
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </button>
                                                                ),
                                                            )
                                                        ) : customerSearch.trim() ? (
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    handleCreateCustomer
                                                                }
                                                                disabled={
                                                                    isCreatingCustomer
                                                                }
                                                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                                                            >
                                                                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
                                                                    <Plus className="size-3.5 text-primary" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-semibold text-foreground">
                                                                        {isCreatingCustomer
                                                                            ? 'Membuat...'
                                                                            : `Buat Pelanggan Baru "${customerSearch}"`}
                                                                    </p>
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        Nama
                                                                        pelanggan
                                                                        belum
                                                                        terdaftar
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            <p className="px-3 py-3 text-center text-[12px] text-muted-foreground">
                                                                Ketik nama
                                                                pelanggan
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Voucher
                                </Label>
                                {appliedVoucher ? (
                                    <div className="flex h-11 items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3">
                                        <div className="flex items-center gap-2">
                                            <TicketPercent className="size-4 text-emerald-600" />
                                            <span className="text-[13px] font-semibold text-emerald-800">
                                                {appliedVoucher.code}
                                            </span>
                                            <span className="text-[11px] text-emerald-600">
                                                -{fmt(appliedVoucher.discount)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAppliedVoucher(null)
                                            }
                                            className="flex size-6 items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-100 hover:text-emerald-700"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            value={voucherCode}
                                            onChange={(e) => {
                                                setVoucherCode(e.target.value);
                                                setVoucherError('');
                                            }}
                                            placeholder="Masukkan kode voucher"
                                            className="h-11 flex-1 rounded-xl text-[13px] font-medium"
                                        />
                                        <Button
                                            type="button"
                                            onClick={applyVoucher}
                                            disabled={
                                                isValidatingVoucher ||
                                                !voucherCode.trim()
                                            }
                                            className="h-11 rounded-xl bg-primary px-4 text-[12px] font-bold text-primary-foreground hover:bg-primary/90"
                                        >
                                            {isValidatingVoucher
                                                ? '...'
                                                : 'Gunakan'}
                                        </Button>
                                    </div>
                                )}
                                {voucherError && (
                                    <p className="mt-1 text-[11px] font-medium text-red-500">
                                        {voucherError}
                                    </p>
                                )}
                            </div>

                            {selectedCustomer &&
                                selectedCustomer.loyalty_points >=
                                    MIN_REDEEM_POINTS && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                Tukar Poin
                                            </Label>
                                            <span className="text-[11px] text-muted-foreground">
                                                {selectedCustomer.loyalty_points.toLocaleString()}{' '}
                                                poin tersedia
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3">
                                            <div className="flex flex-1 items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min={MIN_REDEEM_POINTS}
                                                    max={maxRedeemPoints}
                                                    value={redeemPointsInput}
                                                    onChange={(e) =>
                                                        setRedeemPointsInput(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Jumlah poin"
                                                    className="h-9 flex-1 rounded-lg text-[13px] font-medium"
                                                />
                                            </div>
                                            {redeemedPoints >=
                                                MIN_REDEEM_POINTS && (
                                                <span className="shrink-0 text-[12px] font-bold text-red-500">
                                                    -{fmt(pointDiscount)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Metode Pembayaran
                                </Label>
                                <select
                                    value={paymentMethodId}
                                    onChange={(e) =>
                                        setPaymentMethodId(
                                            Number(e.target.value),
                                        )
                                    }
                                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-primary"
                                >
                                    <option value="" disabled>
                                        Pilih Metode Pembayaran
                                    </option>
                                    {paymentMethods.map((pm) => (
                                        <option key={pm.id} value={pm.id}>
                                            {pm.name} ({pm.type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Jumlah Uang
                                </Label>
                                <CurrencyInput
                                    autoFocus
                                    value={paidAmount}
                                    onChange={setPaidAmount}
                                    placeholder="Masukkan jumlah"
                                    className="h-11 rounded-xl text-[14px] font-bold focus-visible:ring-primary"
                                />
                            </div>
                            {parseFloat(paidAmount) >= total && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950"
                                >
                                    <span className="text-[12px] font-bold text-green-700">
                                        Kembalian
                                    </span>
                                    <span className="text-[15px] font-black text-green-700">
                                        {fmt(parseFloat(paidAmount) - total)}
                                    </span>
                                </motion.div>
                            )}
                        </div>
                        <div className="flex shrink-0 gap-3 px-5 pb-5 sm:px-7 sm:pb-7">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="h-12 flex-1 rounded-xl text-[13px] font-bold"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    isProcessing ||
                                    !paidAmount ||
                                    parseFloat(paidAmount) < total
                                }
                                className="h-12 flex-[2] rounded-xl bg-primary text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
                            >
                                {isProcessing
                                    ? 'Memproses...'
                                    : 'Konfirmasi Bayar'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── SUCCESS MODAL ── */}
            <Dialog
                open={isSuccessModalOpen}
                onOpenChange={setIsSuccessModalOpen}
            >
                <DialogContent
                    className="border-none bg-card p-0 text-center shadow-2xl max-sm:top-0 max-sm:left-0 max-sm:h-full max-sm:max-h-dvh max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none sm:max-w-[400px] sm:rounded-[1.5rem]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 sm:p-10">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-green-100">
                            <CheckCircle2 className="size-9 text-green-600" />
                        </div>
                        <div>
                            <VisuallyHidden>
                                <DialogTitle>Transaksi Berhasil!</DialogTitle>
                            </VisuallyHidden>
                            <h3 className="text-xl font-black text-foreground">
                                Transaksi Berhasil!
                            </h3>
                            <p className="mt-1.5 text-[13px] text-muted-foreground">
                                Stok diperbarui dan transaksi tercatat.
                            </p>
                        </div>
                        <Button
                            onClick={() => printToPrinter('bluetooth')}
                            disabled={isPrinting}
                            className="flex h-11 w-full items-center gap-2 rounded-xl bg-primary text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
                        >
                            <svg
                                className="size-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M6 7l6 10 6-10" />
                                <path d="M12 17V3" />
                            </svg>{' '}
                            {isPrinting ? 'Mencetak...' : 'Cetak Bluetooth'}
                        </Button>
                        <Button
                            onClick={() => printToPrinter('usb')}
                            disabled={isPrinting}
                            variant="outline"
                            className="flex h-11 w-full items-center gap-2 rounded-xl text-[13px] font-bold"
                        >
                            <Receipt className="size-4" />{' '}
                            {isPrinting ? 'Mencetak...' : 'Cetak Printer (USB)'}
                        </Button>
                        <Button
                            onClick={() => printToPrinter('file')}
                            disabled={isPrinting}
                            variant="secondary"
                            className="flex h-11 w-full items-center gap-2 rounded-xl text-[13px] font-bold"
                        >
                            <svg
                                className="size-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>{' '}
                            {isPrinting ? 'Menyimpan...' : 'Simpan Struk (File)'}
                        </Button>
                        {webUsbSupported && (
                            <Button
                                onClick={handleWebUsbPrint}
                                disabled={isWebUsbPrinting}
                                variant="default"
                                className="flex h-11 w-full items-center gap-2 rounded-xl border-2 border-green-500 bg-green-50 text-[13px] font-bold text-green-700 hover:bg-green-100"
                            >
                                <svg
                                    className="size-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <rect x="2" y="3" width="20" height="14" rx="2" />
                                    <path d="M8 21h8" />
                                    <path d="M12 17v4" />
                                </svg>{' '}
                                {isWebUsbPrinting
                                    ? 'Mencetak...'
                                    : usbDeviceName
                                      ? `Cetak ke ${usbDeviceName}`
                                      : 'Cetak Otomatis (USB)'}
                            </Button>
                        )}
                        <Button
                            onClick={() => setIsSuccessModalOpen(false)}
                            className="h-11 w-full rounded-xl bg-secondary text-[13px] font-bold text-secondary-foreground hover:bg-secondary/80"
                        >
                            Selesai
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
