<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AuditLog::with('causer');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('event', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('subject_type', 'like', "%{$search}%");
            });
        }

        if ($event = $request->get('event')) {
            $query->where('event', $event);
        }

        if ($type = $request->get('type')) {
            if ($type === 'admin') {
                $query->whereIn('event', [
                    'suspended', 'activated', 'updated', 'reset',
                    'entered', 'bulk_activate', 'bulk_suspend', 'bulk_delete',
                ]);
            } elseif ($type === 'model') {
                $query->whereIn('event', ['created', 'updated', 'deleted', 'restored']);
            }
        }

        $logs = $query->latest()->paginate(30);

        return Inertia::render('admin/audit-logs', [
            'logs' => $logs->through(fn ($log) => [
                'id' => $log->id,
                'user' => $log->causer?->name ?? 'System',
                'action' => $log->event ?? $log->description,
                'description' => $log->description,
                'subject' => class_basename($log->subject_type ?? ''),
                'ip_address' => $log->properties['ip'] ?? null,
                'created_at' => $log->created_at->timezone('Asia/Jakarta')->format('d M Y H:i'),
            ]),
            'filters' => [
                'search' => $request->get('search'),
                'event' => $request->get('event'),
                'type' => $request->get('type'),
            ],
        ]);
    }
}
