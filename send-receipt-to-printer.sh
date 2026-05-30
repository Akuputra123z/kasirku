#!/bin/bash
# Send latest receipt to Bluetooth printer (RPP02N)
# Usage: ./send-receipt-to-printer.sh [path/to/file.bin]

DEVICE="${PRINT_DEVICE:-/dev/cu.RPP02N}"
MAC="${PRINT_MAC:-$(grep -oP 'PRINT_BLUETOOTH_MAC=\K.*' .env 2>/dev/null || echo '86:67:7A:9E:0E:1B')}"
BAUD="${PRINT_BAUD:-9600}"
RECEIPTS_DIR="${PRINT_RECEIPTS_DIR:-storage/logs/receipts}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -e "$DEVICE" ]; then
    echo "❌ Device $DEVICE not found. Is the printer paired via Bluetooth?"
    echo "   Check: System Settings → Bluetooth → RPP02N"
    exit 1
fi

if [ -n "$1" ]; then
    FILE="$1"
elif [ -d "$RECEIPTS_DIR" ]; then
    FILE=$(ls -t "$RECEIPTS_DIR"/*.bin 2>/dev/null | head -1)
fi

if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
    echo "❌ No receipt file found."
    echo "   Usage: $0 [path/to/file.bin]"
    echo "   Or run 'Cetak Printer' button first to generate a receipt."
    exit 1
fi

echo "📄 Receipt: $FILE ($(wc -c < "$FILE") bytes)"

blueutil --connect "$MAC" 2>/dev/null
sleep 2

PRINT_DEVICE="$DEVICE" PRINT_BAUD="$BAUD" PRINT_LOCK_FILE="/tmp/rpp02n_print.lock" \
    python3 "$SCRIPT_DIR/send-receipt.py" "$FILE"
exit $?
