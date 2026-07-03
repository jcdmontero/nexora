import { createInertiaApp, router } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { ToastProvider } from '@/Components/toasts/ToastProvider'
import { enqueue } from '@/lib/sync-queue'
import React from 'react'
import './../css/app.css'

// Laravel Echo — WebSocket via Soketi (Pusher-compatible)
if (import.meta.env.VITE_PUSHER_APP_KEY) {
  import('laravel-echo').then(({ default: Echo }) => {
    import('pusher-js').then(({ default: Pusher }) => {
      window.Pusher = Pusher
      window.Echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        wsHost: import.meta.env.VITE_PUSHER_HOST || '127.0.0.1',
        wsPort: parseInt(import.meta.env.VITE_PUSHER_PORT || '6001'),
        wssPort: parseInt(import.meta.env.VITE_PUSHER_PORT || '6001'),
        forceTLS: import.meta.env.VITE_PUSHER_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
      })
    })
  })
}

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

// Handler global de errores de red y respuestas inválidas
function showErrorBanner(message, type = 'error') {
  const existing = document.getElementById('global-error-banner')
  if (existing) existing.remove()

  const banner = document.createElement('div')
  banner.id = 'global-error-banner'
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    padding: 12px 20px; font-size: 14px; font-weight: 500;
    display: flex; align-items: center; justify-content: space-between;
    animation: slideDown 0.3s ease-out;
  `
  if (type === 'error') {
    banner.style.backgroundColor = '#fee2e2'
    banner.style.color = '#991b1b'
    banner.style.borderBottom = '2px solid #f87171'
  } else {
    banner.style.backgroundColor = '#fef3c7'
    banner.style.color = '#92400e'
    banner.style.borderBottom = '2px solid #fbbf24'
  }

  banner.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:18px;color:inherit;padding:0 4px">&times;</button>
  `
  document.body.prepend(banner)
  setTimeout(() => banner.remove(), 8000)
}

router.on('invalid', (event) => {
  const status = event.detail?.response?.status
  if (status === 403) {
    showErrorBanner('No tienes permiso para acceder a esta sección.', 'warning')
  } else if (status === 404) {
    showErrorBanner('El recurso solicitado no fue encontrado.', 'warning')
  } else if (status >= 500) {
    showErrorBanner('Error del servidor. Por favor, intenta de nuevo.', 'error')
  }
})

router.on('error', (event) => {
  if (!navigator.onLine) {
    showErrorBanner('Sin conexión a internet. Tus cambios se enviarán cuando se restablezca la conexión.', 'warning')
  } else {
    showErrorBanner('Error de conexión. Verifica tu red e intenta de nuevo.', 'error')
  }
})

// PWA: registrar service worker + manejar operaciones offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})

    // Escuchar mensajes del SW (operaciones interceptadas offline)
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data?.type === 'OFFLINE_OPERATION') {
        const payload = event.data.payload
        await enqueue({
          type: payload.type || 'unknown',
          endpoint: payload.endpoint || '/',
          method: payload.method || 'POST',
          data: payload.data || payload,
        })
      }
    })
  })
}
