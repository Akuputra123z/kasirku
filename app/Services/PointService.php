<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\PointTransaction;
use App\Models\Tenant;
use App\Models\Transaction;

class PointService
{
    public static function getConfig(): array
    {
        $tenant = tenant();

        if ($tenant instanceof Tenant) {
            return $tenant->getPointConfig();
        }

        return [
            'points_per_currency' => 10000,
            'point_value' => 100,
            'min_redeem_points' => 100,
        ];
    }

    public static function calculateEarnedPoints(int $totalAmount): int
    {
        $config = self::getConfig();

        return (int) floor($totalAmount / $config['points_per_currency']);
    }

    public static function calculateRedeemDiscount(int $points): int
    {
        $config = self::getConfig();

        return $points * $config['point_value'];
    }

    public static function earnPoints(Customer $customer, Transaction $transaction, int $totalAmount): void
    {
        $points = self::calculateEarnedPoints($totalAmount);

        if ($points <= 0) {
            return;
        }

        $customer->increment('loyalty_points', $points);

        PointTransaction::create([
            'customer_id' => $customer->id,
            'transaction_id' => $transaction->id,
            'type' => 'earn',
            'points' => $points,
            'description' => "Poin dari transaksi {$transaction->transaction_code}",
        ]);
    }

    public static function redeemPoints(Customer $customer, Transaction $transaction, int $points): void
    {
        $customer->decrement('loyalty_points', $points);

        PointTransaction::create([
            'customer_id' => $customer->id,
            'transaction_id' => $transaction->id,
            'type' => 'redeem',
            'points' => $points,
            'description' => "Penukaran poin pada transaksi {$transaction->transaction_code}",
        ]);
    }
}
