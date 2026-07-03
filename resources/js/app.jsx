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
    const tsxPath = `./Pages/${name}.tsx`
    const jsxPath = `./Pages/${name}.jsx`
    const key = tsxPath in pages ? tsxPath : jsxPath
    return resolvePageComponent(key, pages)
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

    if (reactRoot) {
      reactRoot.render(root)
      return
    }

    if (el.hasChildNodes()) {
      reactRoot = hydrateRoot(el, root)
    } else {
      reactRoot = createRoot(el)
      reactRoot.render(root)
    }
  },
  progress: {
    color: '#2563eb',
  },
})
