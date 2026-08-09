<?php

return [
    // filter_var agar nilai dari .env seperti 'false', '0', '1' diparse dengan
    // benar (cast (bool) sebelumnya membuat string 'false' menjadi true).
    'enabled' => filter_var(env('SUBSCRIPTION_ENABLED', true), FILTER_VALIDATE_BOOL),

    'limits' => [
        'products' => (int) env('SUBSCRIPTION_LIMIT_PRODUCTS', 50),
        'staff' => (int) env('SUBSCRIPTION_LIMIT_STAFF', 2),
    ],

    'pricing' => [
        'monthly' => (int) env('SUBSCRIPTION_PRICE_MONTHLY', 50000),
        'yearly' => (int) env('SUBSCRIPTION_PRICE_YEARLY', 500000),
    ],

    'trial_days' => (int) env('SUBSCRIPTION_TRIAL_DAYS', 14),

    'grace_days' => (int) env('SUBSCRIPTION_GRACE_DAYS', 3),
];
