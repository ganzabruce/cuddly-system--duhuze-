"use client";

import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    MinusCircleIcon,
} from "@heroicons/react/24/outline";
import type { ServiceStatus } from "@/types/admin";

type ServiceStatusIndicatorProps = {
    status: ServiceStatus;
    className?: string;
};

const statusConfig: Record<
    ServiceStatus,
    { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
    healthy: {
        label: "Healthy",
        icon: CheckCircleIcon,
        className: "text-success",
    },
    degraded: {
        label: "Degraded",
        icon: ExclamationTriangleIcon,
        className: "text-warning-deep",
    },
    down: {
        label: "Down",
        icon: XCircleIcon,
        className: "text-destructive",
    },
    not_configured: {
        label: "Not configured",
        icon: MinusCircleIcon,
        className: "text-muted-foreground",
    },
};

export function ServiceStatusIndicator({ status, className = "" }: ServiceStatusIndicatorProps) {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${config.className} ${className}`}
        >
            <Icon className="h-5 w-5 shrink-0" />
            {config.label}
        </span>
    );
}
