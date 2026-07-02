'use client';

import { Link } from '@inertiajs/react';
import { Facebook, Camera, PlayCircle, Play, Apple } from 'lucide-react';

export default function MarketplaceFooter() {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 mt-12 py-12 px-4 md:px-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#4648d4] flex items-center justify-center">
                            <span className="text-white text-xs font-bold">K</span>
                        </div>
                        <span className="text-xl font-bold text-[#4648d4]">Kasirku UMKM</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Platform marketplace modern yang menghubungkan UMKM lokal dengan pelanggan di seluruh Indonesia.
                    </p>
                    <div className="flex space-x-3">
                        {[
                            { icon: Facebook, href: '#' },
                            { icon: Camera, href: '#' },
                            { icon: PlayCircle, href: '#' },
                        ].map(({ icon: Icon, href }, i) => (
                            <a key={i} href={href}
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-emerald-600 hover:text-white transition-all">
                                <Icon className="size-5" />
                            </a>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-bold mb-6">Tentang</h4>
                    <ul className="space-y-3 text-sm text-slate-500">
                        <li><Link className="hover:text-emerald-600" href="/stores">Tentang Kami</Link></li>
                        <li><Link className="hover:text-emerald-600" href="/stores">Blog Marketplace</Link></li>
                        <li><Link className="hover:text-emerald-600" href="/stores">Katalog UMKM</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6">Bantuan</h4>
                    <ul className="space-y-3 text-sm text-slate-500">
                        <li><span className="hover:text-emerald-600 cursor-default">Pusat Bantuan</span></li>
                        <li><span className="hover:text-emerald-600 cursor-default">Kebijakan Privasi</span></li>
                        <li><span className="hover:text-emerald-600 cursor-default">Syarat & Ketentuan</span></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6">Unduh Aplikasi</h4>
                    <div className="space-y-4">
                        {[
                            { icon: Play, text1: 'Get it on', text2: 'Google Play' },
                            { icon: Apple, text1: 'Download on the', text2: 'App Store' },
                        ].map(({ icon: Icon, text1, text2 }) => (
                            <div key={text2}
                                className="flex items-center bg-slate-900 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-800 transition-all border border-slate-700">
                                <Icon className="size-6 mr-3" />
                                <div>
                                    <div className="text-[10px] uppercase font-medium">{text1}</div>
                                    <div className="text-sm font-bold">{text2}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 dark:border-slate-800 text-center text-xs text-slate-400">
                &copy; 2024 Marketplace UMKM Indonesia. All rights reserved. Made with ❤️ for local businesses.
            </div>
        </footer>
    );
}
