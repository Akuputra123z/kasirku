import { router } from '@inertiajs/react';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Download,
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ImportResult {
    imported: number;
    errors: string[];
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    route: string;
    templateUrl: string;
}

export function ImportDialog({
    open,
    onOpenChange,
    title,
    description,
    route,
    templateUrl,
}: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = useCallback(() => {
        setFile(null);
        setResult(null);
        setIsImporting(false);
    }, []);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            reset();
        }
        onOpenChange(open);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        const ext = droppedFile?.name?.split('.').pop()?.toLowerCase();
        if (droppedFile && ['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
            setFile(droppedFile);
            setResult(null);
        } else {
            toast.error(
                'Hanya file Excel (.xlsx, .xls) atau CSV yang didukung.',
            );
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleImport = () => {
        if (!file) return;

        setIsImporting(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        router.post(route, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const importResult = page.props.flash?.import as
                    | ImportResult
                    | undefined;
                if (importResult) {
                    setResult(importResult);
                    if (importResult.errors.length === 0) {
                        toast.success(
                            `${importResult.imported} data berhasil diimport.`,
                        );
                    } else {
                        toast.warning(
                            `${importResult.imported} berhasil, ${importResult.errors.length} gagal.`,
                        );
                    }
                }
                setIsImporting(false);
            },
            onError: () => {
                toast.error(
                    'Gagal mengimport file. Periksa format Excel atau CSV.',
                );
                setIsImporting(false);
            },
        });
    };

    const downloadTemplate = () => {
        const link = document.createElement('a');
        link.href = templateUrl;
        link.click();
    };

    const hasErrors = result && result.errors.length > 0;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {result ? (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/50">
                            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                            <div>
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                    {result.imported} data berhasil diimport
                                </p>
                            </div>
                        </div>

                        {hasErrors && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="size-4" />
                                    <span className="text-sm font-medium">
                                        {result.errors.length} baris gagal:
                                    </span>
                                </div>
                                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/50">
                                    {result.errors.map((err, i) => (
                                        <p
                                            key={i}
                                            className="text-xs text-amber-700 dark:text-amber-300"
                                        >
                                            {err}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                onClick={() => handleOpenChange(false)}
                                className="w-full"
                            >
                                Selesai
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={downloadTemplate}
                                className="w-full gap-2 text-sm"
                            >
                                <Download className="size-4" />
                                Download Template Excel
                            </Button>

                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
                                    isDragging
                                        ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30'
                                        : file
                                          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'
                                          : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-700'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                {file ? (
                                    <>
                                        <FileSpreadsheet className="size-10 text-emerald-500" />
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-foreground">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)}{' '}
                                                KB
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                            className="text-xs text-red-500 hover:text-red-600"
                                        >
                                            Hapus file
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="size-10 text-neutral-400" />
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-foreground">
                                                Klik atau tarik file Excel ke
                                                sini
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Format: .xlsx, .xls, atau .csv
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                                <AlertTriangle className="size-4 shrink-0 text-blue-500" />
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Baris pertama harus berisi nama kolom
                                    (header). Pastikan file Excel tidak memiliki
                                    sel yang digabung (merged cells).
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleImport}
                                disabled={!file || isImporting}
                                className="gap-2"
                            >
                                {isImporting ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Upload className="size-4" />
                                )}
                                {isImporting ? 'Mengimport...' : 'Import Data'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
