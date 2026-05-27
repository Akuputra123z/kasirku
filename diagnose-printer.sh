#!/bin/bash
# Diagnose RPP02N Bluetooth printer connection
DEVICE="/dev/cu.RPP02N"
MAC="86:67:7A:9E:0E:1B"

echo "=== Printer Diagnostics ==="
echo ""

echo "1. Bluetooth connection status:"
blueutil --is-connected "$MAC" 2>/dev/null && echo "   ✅ Connected" || echo "   ❌ Not connected"
echo ""

echo "2. Device file:"
if [ -e "$DEVICE" ]; then
    echo "   ✅ $DEVICE exists"
    ls -la "$DEVICE"
else
    echo "   ❌ $DEVICE not found"
fi
echo ""

echo "3. Pairing info:"
blueutil --info "$MAC" 2>/dev/null || echo "   Not found"
echo ""

echo "4. Current serial settings:"
stty -f "$DEVICE" 2>/dev/null || echo "   Cannot read settings"
echo ""

echo "5. Try connecting:"
blueutil --connect "$MAC" 2>/dev/null
sleep 3
blueutil --is-connected "$MAC" 2>/dev/null && echo "   ✅ Now connected" || echo "   ❌ Still not connected"
echo ""

echo "6. Testing with 9600 baud (RPP02N default):"
stty -f "$DEVICE" clocal -hupcl 9600 2>/dev/null
echo "RPP02N TEST PRINT @ 9600" > "$DEVICE" 2>/dev/null
sleep 0.5
printf "\x1b\x40" > "$DEVICE" 2>/dev/null  # ESC @ (initialize printer)
sleep 0.5
printf "AMERTA KOMPUTER\nTest print 9600\n\n\n\n" > "$DEVICE" 2>/dev/null
echo "   ✅ Data sent at 9600 baud"
echo ""

echo "7. Testing with 115200 baud:"
stty -f "$DEVICE" clocal -hupcl 115200 2>/dev/null
printf "\x1b\x40" > "$DEVICE" 2>/dev/null
sleep 0.5
printf "AMERTA KOMPUTER\nTest print 115200\n\n\n\n" > "$DEVICE" 2>/dev/null
echo "   ✅ Data sent at 115200 baud"
echo ""

echo "=== Done ==="
echo "If the printer printed something at step 6 or 7,"
echo "update the baud rate in send-receipt-to-printer.sh"
