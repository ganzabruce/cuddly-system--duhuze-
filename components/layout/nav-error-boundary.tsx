"use client";

import { Component, type ReactNode } from "react";

/**
 * Error boundary for nav components. Swallows errors so the rest of the layout
 * (e.g. sidebar, main content) can still render.
 */
export class NavErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}
