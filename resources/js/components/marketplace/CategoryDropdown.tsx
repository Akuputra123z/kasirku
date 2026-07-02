'use client';

import { Link } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface CategoryChild {
    name: string;
    slug: string;
}

interface CategoryParent {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    children: CategoryChild[];
}

interface CategoryDropdownProps {
    categories: CategoryParent[];
}

export default function CategoryDropdown({ categories }: CategoryDropdownProps) {
    const [open, setOpen] = useState(false);
    const [activeSlug, setActiveSlug] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const openMenu = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setOpen(true);
    };

    const closeMenu = () => {
        timerRef.current = setTimeout(() => setOpen(false), 200);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Auto-select first parent with children when menu opens
    useEffect(() => {
        if (open) {
            const firstWithChildren = categories.find((c) => c.children.length > 0);
            setActiveSlug(firstWithChildren?.slug ?? categories[0]?.slug ?? null);
        } else {
            setActiveSlug(null);
        }
    }, [open, categories]);

    const activeParent = categories.find((c) => c.slug === activeSlug);

    if (categories.length === 0) {
        return (
            <Link href="/all-products" className="text-sm font-medium text-slate-600 hover:text-[#4648d4] whitespace-nowrap">
                Kategori
            </Link>
        );
    }

    return (
        <div ref={rootRef} className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
            <button className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-[#4648d4] whitespace-nowrap">
                Kategori
                <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/20" />
                    <div
                        className="fixed left-0 right-0 top-[114px] z-50 mx-auto max-w-7xl px-4 md:px-20"
                        onMouseEnter={openMenu}
                        onMouseLeave={closeMenu}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-sm text-slate-900">Kategori Pilihan</h3>
                                <Link
                                    href="/all-products"
                                    className="text-sm text-[#4648d4] font-medium hover:underline"
                                    onClick={() => setOpen(false)}
                                >
                                    Semua Kategori →
                                </Link>
                            </div>

                            {/* Body: Left (parents) + Right (children) */}
                            <div className="flex max-h-[420px]">
                                {/* Left: Parent Categories */}
                                <div className="w-56 shrink-0 border-r border-gray-100 py-2 overflow-y-auto">
                                    {categories.map((parent) => {
                                        const isActive = parent.slug === activeSlug;
                                        return (
                                            <Link
                                                key={parent.slug}
                                                href={`/all-products?category=${parent.slug}`}
                                                onMouseEnter={() => setActiveSlug(parent.slug)}
                                                onClick={() => setOpen(false)}
                                                className={`flex items-center justify-between px-5 py-2.5 text-sm transition-colors ${
                                                    isActive
                                                        ? 'bg-[#eef0ff] text-[#4648d4] font-semibold'
                                                        : 'text-slate-700 hover:bg-gray-50 hover:text-[#4648d4]'
                                                }`}
                                            >
                                                <span>{parent.name}</span>
                                                {parent.children.length > 0 && (
                                                    <ChevronRight className={`size-3.5 ${isActive ? 'text-[#4648d4]' : 'text-slate-300'}`} />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Right: Children of active parent */}
                                <div className="flex-1 p-6 overflow-y-auto">
                                    {activeParent && activeParent.children.length > 0 ? (
                                        <div>
                                            <Link
                                                href={`/all-products?category=${activeParent.slug}`}
                                                className="block font-semibold text-sm text-slate-900 mb-4 hover:text-[#4648d4]"
                                                onClick={() => setOpen(false)}
                                            >
                                                Semua {activeParent.name} →
                                            </Link>
                                            <div className="grid grid-cols-3 gap-x-8 gap-y-2">
                                                {activeParent.children.map((child) => (
                                                    <Link
                                                        key={child.slug}
                                                        href={`/all-products?category=${child.slug}`}
                                                        className="block text-xs text-slate-500 hover:text-[#4648d4] hover:underline py-1"
                                                        onClick={() => setOpen(false)}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-sm text-slate-400">
                                                {activeParent ? 'Belum ada sub-kategori' : 'Pilih kategori di samping'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
