import { UsersIcon, CalendarDaysIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { StatCard } from "@/components/layout/StatCard";

export function PlatformStatsCards({
    totalUsers,
    totalEvents,
    totalRSVPs,
}: {
    totalUsers: number;
    totalEvents: number;
    totalRSVPs: number;
}) {
    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-4">
            <StatCard title="Total Users" value={totalUsers} icon={UsersIcon} href="/admin/users" />
            <StatCard title="Total Events" value={totalEvents} icon={CalendarDaysIcon} href="/admin/events" />
            <StatCard title="Total RSVPs" value={totalRSVPs} icon={CheckCircleIcon} />
        </div>
    );
}
