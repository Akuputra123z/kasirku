<?php

use App\Models\Tenant;

if (! function_exists('tenant_id')) {
    function tenant_id(): ?string
    {
        return app()->bound('current.tenant') ? app('current.tenant')->id : null;
    }
}

if (! function_exists('tenant')) {
    function tenant(): ?Tenant
    {
        return app()->bound('current.tenant') ? app('current.tenant') : null;
    }
}
