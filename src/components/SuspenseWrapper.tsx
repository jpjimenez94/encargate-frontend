import React, { Suspense, ComponentType } from 'react';

interface LoadingFallbackProps {
  message?: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message = 'Cargando...' }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  </div>
);

/**
 * Higher-Order Component que envuelve cualquier componente con Suspense
 * Útil para páginas que usan useSearchParams() o useRouter()
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  loadingMessage?: string
) {
  const WrappedComponent = (props: P) => (
    <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
      <Component {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

export default withSuspense;
