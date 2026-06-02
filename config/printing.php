<?php

return [
    'driver' => env('PRINT_DRIVER', 'file'),

    'connectors' => [
        'network' => [
            'host' => env('PRINT_HOST', '127.0.0.1'),
            'port' => env('PRINT_PORT', 9100),
        ],

        'usb' => [
            'printer' => env('PRINT_USB_PRINTER'),
        ],

        'windows' => [
            'printer' => env('PRINT_WINDOWS_PRINTER'),
        ],

        'file' => [
            'path' => env('PRINT_FILE_PATH', storage_path('logs/receipts')),
        ],

        'bluetooth' => [
            'device' => env('PRINT_BLUETOOTH_DEVICE'),
            'mac' => env('PRINT_BLUETOOTH_MAC'),
        ],
    ],

    'receipt' => [
        'width' => 32,
        'store_name' => env('STORE_NAME'),
        'store_address' => env('STORE_ADDRESS'),
        'store_phone' => env('STORE_PHONE'),
        'footer' => env('PRINT_FOOTER'),
    ],
];
