export function formatCurrency(amount: number): string {
    return 'Rp' + amount.toLocaleString('id-ID');
}

export class EscposBuilder {
    private buffer: number[] = [];

    init() {
        this.buffer.push(0x1b, 0x40);
        return this;
    }

    center() {
        this.buffer.push(0x1b, 0x61, 0x01);
        return this;
    }

    left() {
        this.buffer.push(0x1b, 0x61, 0x00);
        return this;
    }

    right() {
        this.buffer.push(0x1b, 0x61, 0x02);
        return this;
    }

    doubleHeight() {
        this.buffer.push(0x1d, 0x21, 0x10);
        return this;
    }

    doubleWidth() {
        this.buffer.push(0x1d, 0x21, 0x01);
        return this;
    }

    normal() {
        this.buffer.push(0x1d, 0x21, 0x00);
        return this;
    }

    line(text: string) {
        const bytes = new TextEncoder().encode(text + '\n');
        this.buffer.push(...bytes);
        return this;
    }

    feed(n = 1) {
        this.buffer.push(0x1b, 0x64, n);
        return this;
    }

    separator(char: string, width: number) {
        this.line(char.repeat(width));
        return this;
    }

    cut() {
        this.buffer.push(0x1d, 0x56, 0x00);
        return this;
    }

    build(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}
