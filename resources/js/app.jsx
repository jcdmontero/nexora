import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { ToastProvider } from '@/Components/toasts/ToastProvider'
import React from 'react'
import './../css/app.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', backgroundColor: '#fee2e2', color: '#991b1b', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>¡Error en la aplicación React!</h1>
          <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

let reactRoot = null

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.{jsx,tsx}')
    // Try .tsx first, then .jsx — avoids stale .jsx shadowing newer .tsx files
    return resolvePageComponent(`./Pages/${name}.tsx`, pages).catch(() =>
      resolvePageComponent(`./Pages/${name}.jsx`, pages),
    )
  },
  setup({ el, App, props }) {
    const root = (
      <ErrorBoundary>
        <App {...props}>
          {({ Component, props: pageProps, key }) => (
            <ToastProvider>
              <Component key={key} {...pageProps} />
            </ToastProvider>
          )}
        </App>
      </ErrorBoundary>
    )

    // Inertia calls setup() on every page visit. Use a module-level ref to
    // avoid calling createRoot/hydrateRoot on an already-managed container.
    if (reactRoot) {
      reactRoot.render(root)
      return
    }

    const isSsr = el.hasAttribute('data-page')
    reactRoot = isSsr ? hydrateRoot(el, root) : createRoot(el)
    reactRoot.render(root)
  },
  progress: {
    color: '#2563eb',
  },
})
