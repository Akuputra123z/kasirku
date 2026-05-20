'use client';

import { motion } from 'motion/react';
import * as React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

interface FloatingPillProps {
    activePage: number;
    setActivePage: (page: number) => void;
    totalPages: number;
}

export default function FloatingPill({
    activePage,
    setActivePage,
    totalPages,
}: FloatingPillProps) {
    return (
        <Pagination>
            <PaginationContent className="rounded-full border bg-background/80 p-1 transition-all">
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActivePage(Math.max(1, activePage - 1));
                        }}
                        className="rounded-full hover:bg-muted"
                    />
                </PaginationItem>

                <div className="relative mx-1 flex items-center">
                    {Array.from({ length: totalPages }).map((_, i) => {
                        const page = i + 1;
                        const isActive = activePage === page;

                        return (
                            <PaginationItem key={page} className="relative">
                                <PaginationLink
                                    href="#"
                                    isActive={isActive}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActivePage(page);
                                    }}
                                    className={cn(
                                        'relative z-10 h-9 w-9 rounded-full border-0 text-xs font-bold tracking-tighter uppercase transition-colors',
                                        isActive
                                            ? 'bg-transparent text-primary-foreground hover:bg-transparent hover:text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    {page}
                                </PaginationLink>
                                {isActive && (
                                    <motion.div
                                        layoutId="pill-active"
                                        className="absolute inset-0 rounded-full bg-primary shadow-md"
                                        transition={{
                                            type: 'spring',
                                            bounce: 0.2,
                                            duration: 0.6,
                                        }}
                                    />
                                )}
                            </PaginationItem>
                        );
                    })}
                </div>

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActivePage(Math.min(totalPages, activePage + 1));
                        }}
                        className="rounded-full transition-transform hover:bg-muted active:scale-95"
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
