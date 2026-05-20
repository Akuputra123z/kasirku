<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\PointTransaction;
use App\Models\Transaction;

class PointService
{
    const int POINTS_PER_CURRENCY = 10000;

    const int POINT_VALUE = 100;

    const int MIN_REDEEM_POINTS = 100;

    public static function calculateEarnedPoints(int $totalAmount): int
    {
        return (int) floor($totalAmount / self::POINTS_PER_CURRENCY);
    }

    public static function calculateRedeemDiscount(int $points): int
    {
        return $points * self::POINT_VALUE;
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
