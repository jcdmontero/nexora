import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/Components/ui/skeleton';

/**
 * Lazy load a component with a loading skeleton
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} options - Configuration options
 * @returns {React.Component} Lazy loaded component
 */
export function lazyLoad(importFunc, options = {}) {
    const {
        fallback = <Skeleton className="h-64 w-full" />,
        displayName = 'LazyComponent',
    } = options;

    const LazyComponent = lazy(importFunc);

    const WrappedComponent = (props) => (
        <Suspense fallback={fallback}>
            <LazyComponent {...props} />
        </Suspense>
    );

    WrappedComponent.displayName = displayName;

    return WrappedComponent;
}

/**
 * Lazy load a page component
 * @param {Function} importFunc - Dynamic import function
 * @returns {React.Component} Lazy loaded page
 */
export function lazyPage(importFunc) {
    return lazyLoad(importFunc, {
        fallback: (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        ),
        displayName: 'LazyPage',
    });
}

/**
 * Lazy load a modal component
 * @param {Function} importFunc - Dynamic import function
 * @returns {React.Component} Lazy loaded modal
 */
export function lazyModal(importFunc) {
    return lazyLoad(importFunc, {
        fallback: null, // No fallback for modals
        displayName: 'LazyModal',
    });
}

/**
 * Lazy load a chart component
 * @param {Function} importFunc - Dynamic import function
 * @returns {React.Component} Lazy loaded chart
 */
export function lazyChart(importFunc) {
    return lazyLoad(importFunc, {
        fallback: (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                <div className="animate-pulse text-muted-foreground">Cargando gráfico...</div>
            </div>
        ),
        displayName: 'LazyChart',
    });
}

// Pre-configured lazy loaded components
export const LazyRecharts = lazyChart(() => import('recharts'));
export const LazyReactBarcode = lazyLoad(() => import('react-barcode'), {
    fallback: <Skeleton className="h-32 w-48" />,
    displayName: 'LazyBarcode',
});

// Export utility for creating lazy loaded components
export default {
    lazyLoad,
    lazyPage,
    lazyModal,
    lazyChart,
    LazyRecharts,
    LazyReactBarcode,
};
