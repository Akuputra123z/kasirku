<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('subscription_status', 'active')->count();
        $suspendedTenants = Tenant::where('subscription_status', 'suspended')->count();

        $monthlyGrowth = Tenant::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => Carbon::parse($row->month.'-01')->translatedFormat('M Y'),
                'count' => (int) $row->count,
            ]);

        $recentActivity = AuditLog::with('causer')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'user' => $log->causer?->name ?? 'System',
                'action' => $log->event ?? $log->description,
                'description' => $log->description,
                'subject' => class_basename($log->subject_type ?? ''),
                'created_at' => $log->created_at->diffForHumans(),
            ]);

        $latestTenants = Tenant::latest()->take(5)->get()->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->name,
            'slug' => $t->slug,
            'status' => $t->subscription_status,
            'created_at' => $t->created_at->diffForHumans(),
        ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total' => $totalTenants,
                'active' => $activeTenants,
                'suspended' => $suspendedTenants,
            ],
            'monthlyGrowth' => $monthlyGrowth,
            'recentActivity' => $recentActivity,
            'latestTenants' => $latestTenants,
        ]);
    }
}
