/**
 * Map icon name strings to Heroicons components
 */

import {
    CalendarDaysIcon,
    UsersIcon,
    AcademicCapIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType } from "react";
import type { SVGProps } from "react";

const iconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
    CalendarDaysIcon,
    UsersIcon,
    AcademicCapIcon,
};

export function getIconComponent(
    iconName: string
): ComponentType<SVGProps<SVGSVGElement>> {
    return iconMap[iconName] || UsersIcon; // Default to UsersIcon if not found
}
