<?php

return [
    'username' => env('DIGIFLAZZ_USERNAME'),
    'secret_key' => env('DIGIFLAZZ_SECRET_KEY'),
    'is_development' => env('DIGIFLAZZ_DEVELOPMENT', true),

    'base_url' => 'https://api.digiflazz.com',

    'markup' => [
        'Pulsa' => ['type' => 'percentage', 'value' => 2],
        'Data' => ['type' => 'percentage', 'value' => 3],
        'PLN' => ['type' => 'fixed', 'value' => 1000],
        'BPJS' => ['type' => 'fixed', 'value' => 2500],
        'PDAM' => ['type' => 'fixed', 'value' => 2500],
        'Telkom' => ['type' => 'fixed', 'value' => 2500],
        'E-Money' => ['type' => 'percentage', 'value' => 2],
        'Game' => ['type' => 'percentage', 'value' => 2],
        'Voucher' => ['type' => 'percentage', 'value' => 2],
    ],

    'default_markup' => ['type' => 'percentage', 'value' => 2],
];
