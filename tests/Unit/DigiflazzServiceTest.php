<?php

use App\Services\DigiflazzService;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

uses(TestCase::class);

test('digiflazz service uses development credentials in development mode', function () {
    Config::set('digiflazz.is_development', true);
    Config::set('digiflazz.username', 'dev-user');
    Config::set('digiflazz.secret_key', 'dev-secret');
    Config::set('digiflazz.production.username', 'prod-user');
    Config::set('digiflazz.production.secret_key', 'prod-secret');

    $service = new DigiflazzService;

    $reflection = new ReflectionClass($service);
    expect($reflection->getProperty('username')->getValue($service))->toBe('dev-user')
        ->and($reflection->getProperty('secretKey')->getValue($service))->toBe('dev-secret');
});

test('digiflazz service uses production credentials in non-development mode', function () {
    Config::set('digiflazz.is_development', false);
    Config::set('digiflazz.username', 'dev-user');
    Config::set('digiflazz.secret_key', 'dev-secret');
    Config::set('digiflazz.production.username', 'prod-user');
    Config::set('digiflazz.production.secret_key', 'prod-secret');

    $service = new DigiflazzService;

    $reflection = new ReflectionClass($service);
    expect($reflection->getProperty('username')->getValue($service))->toBe('prod-user')
        ->and($reflection->getProperty('secretKey')->getValue($service))->toBe('prod-secret');
});

test('digiflazz production credentials fall back to base credentials when not set', function () {
    Config::set('digiflazz.is_development', false);
    Config::set('digiflazz.username', 'dev-user');
    Config::set('digiflazz.secret_key', 'dev-secret');
    Config::set('digiflazz.production.username', null);
    Config::set('digiflazz.production.secret_key', null);

    $service = new DigiflazzService;

    $reflection = new ReflectionClass($service);
    expect($reflection->getProperty('username')->getValue($service))->toBe('dev-user')
        ->and($reflection->getProperty('secretKey')->getValue($service))->toBe('dev-secret');
});
