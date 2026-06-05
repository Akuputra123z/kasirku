const TXT = {
    NORMAL: 0x00,
    EMPHASIZED: 0x08,
    DOUBLE_HEIGHT: 0x10,
    DOUBLE_WIDTH: 0x20,
    UNDERLINE: 0x80,
};

function textEncoder(text: string): number[] {
    return [...new TextEncoder().encode(text)];
}

export class EscposBuilder {
    private buf: number[] = [];

    init() {
        this.buf.push(0x1b, 0x40);

        return this;
    }

    emphasis(on: boolean) {
        this.buf.push(0x1b, 0x45, on ? 0x01 : 0x00);

        return this;
    }

    selectPrintMode(mode: number) {
        this.buf.push(0x1b, 0x21, mode);

        return this;
    }

    center() {
        this.buf.push(0x1b, 0x61, 0x01);

        return this;
    }

    left() {
        this.buf.push(0x1b, 0x61, 0x00);

        return this;
    }

    text(data: string) {
        this.buf.push(...textEncoder(data));

        return this;
    }

    line(data: string) {
        this.buf.push(...textEncoder(data + '\n'));

        return this;
    }

    feed(n = 1) {
        this.buf.push(0x1b, 0x64, n);

        return this;
    }

    separator(char: string, width: number) {
        return this.line(char.repeat(width));
    }

    cut() {
        this.buf.push(0x1d, 0x56, 0x00);

        return this;
    }

    build(): Uint8Array {
        return new Uint8Array(this.buf);
    }
}

export function padLeft(s: string, len: number, ch = ' '): string {
    return s.length >= len ? s : ch.repeat(len - s.length) + s;
}

export function padRight(s: string, len: number, ch = ' '): string {
    return s.length >= len ? s : s + ch.repeat(len - s.length);
}

export function formatIdr(n: number): string {
    return 'Rp' + n.toLocaleString('id-ID');
}

export function formatIdrShort(n: number): string {
    return n.toLocaleString('id-ID');
}

interface ReceiptData {
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    transactionCode: string;
    date: string;
    cashier: string;
    orderType: string;
    paymentMethod?: string;
    customer?: string;
    details: {
        name: string;
        qty: number;
        total: number;
    }[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paid: number;
    change: number;
    footer: string;
}

const W = 32;
const LBL = 12;
const VAL = W - LBL;

function lineItem(lbl: string, val: string): string {
    return padRight(lbl, LBL) + padLeft(val, VAL) + '\n';
}

export function buildReceipt(data: ReceiptData): Uint8Array {
    const e = new EscposBuilder();

    e.init();

    // Store header
    e.center().emphasis(true).line(data.storeName).emphasis(false);

    if (data.storeAddress) {
        e.line(data.storeAddress);
    }

    if (data.storePhone) {
        e.line('Telp: ' + data.storePhone);
    }

    e.feed();

    // Receipt number
    e.center();
    e.separator('-', W);
    e.line('No. Resi: ' + data.transactionCode);
    e.separator('-', W);
    e.feed();

    // Transaction info
    e.left();
    e.line('Tanggal: ' + data.date);
    e.line('Kasir: ' + data.cashier);
    e.line('Tipe: ' + data.orderType);

    if (data.paymentMethod) {
        e.line('Bayar: ' + data.paymentMethod);
    }

    if (data.customer) {
        e.line('Pelanggan: ' + data.customer);
    }

    e.feed();

    // Items header
    e.separator('-', W);
    const hdr = padRight('Item', 14) + padLeft('Qty', 4) + padLeft('Total', 14);
    e.line(hdr);
    e.separator('-', W);

    // Items
    for (const d of data.details) {
        const firstName = d.name.slice(0, 12);
        const restName = d.name.slice(12);
        const subtotal = formatIdrShort(d.total);

        e.line(
            padRight(firstName, 14) +
                padLeft(String(d.qty), 4) +
                padLeft(subtotal, 14),
        );

        let rest = restName;

        while (rest.length > 0) {
            const chunk = rest.slice(0, 12);
            rest = rest.slice(12);
            e.line('  ' + chunk);
        }
    }

    e.separator('-', W);

    // Totals
    e.left();
    e.line(lineItem('Subtotal', formatIdrShort(data.subtotal)));

    if (data.discount > 0) {
        e.line(lineItem('Diskon', '-' + formatIdrShort(data.discount)));
    }

    if (data.tax > 0) {
        e.line(lineItem('Pajak', '+' + formatIdrShort(data.tax)));
    }

    e.separator('=', W);
    e.selectPrintMode(TXT.EMPHASIZED);
    e.line(lineItem('Total', formatIdrShort(data.total)));
    e.selectPrintMode(TXT.NORMAL);
    e.separator('=', W);

    e.line(lineItem('Tunai', formatIdrShort(data.paid)));
    e.line(lineItem('Kembali', formatIdrShort(data.change)));
    e.feed(2);

    // Footer
    e.center();
    e.selectPrintMode(TXT.DOUBLE_HEIGHT | TXT.EMPHASIZED);
    e.line(data.footer);
    e.selectPrintMode(TXT.NORMAL);
    e.line('Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan');
    e.feed(3);
    e.cut();

    return e.build();
}
