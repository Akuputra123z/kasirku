<?php

return [
    'driver' => env('PRINT_DRIVER', 'network'),

    'connectors' => [
        'network' => [
            'host' => env('PRINT_HOST', '127.0.0.1'),
            'port' => env('PRINT_PORT', 9100),
        ],

        'usb' => [
            'printer' => env('PRINT_USB_PRINTER', 'STMicroelectronics_58Printer'),
        ],

        'windows' => [
            'printer' => env('PRINT_WINDOWS_PRINTER', 'POS-80'),
        ],

        'file' => [
            'path' => env('PRINT_FILE_PATH', storage_path('logs/receipts')),
        ],

        'bluetooth' => [
            'device' => env('PRINT_BLUETOOTH_DEVICE', '/dev/cu.PrinterName-SPPDev'),
            'mac' => env('PRINT_BLUETOOTH_MAC'),
        ],
    ],

    'receipt' => [
        'width' => 32,
        'store_name' => env('STORE_NAME', 'AMERTA KOMPUTER'),
        'store_address' => env('STORE_ADDRESS', 'Jl. Diponegoro No.88, Rembang'),
        'store_phone' => env('STORE_PHONE', '085740724793'),
        'footer' => env('PRINT_FOOTER', 'TERIMA KASIH'),
    ],
];
