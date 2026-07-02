import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
            ssr: 'resources/js/ssr.jsx',
        }),
        tailwindcss(),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
        // Fuerza UNA sola copia de React/Inertia aunque haya imports con casing
        // distinto (Windows es case-insensitive y Vite duplicaría módulos),
        // evitando errores como "Cannot read properties of undefined (reading 'subscribe')"
        // y la pérdida de foco en inputs por remontaje.
        dedupe: ['react', 'react-dom', '@inertiajs/react'],
    },
    server: {
        host: '127.0.0.1',
        port: 5173,
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    build: {
        // Target modern browsers for smaller bundles
        target: 'es2020',
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Enable CSS code splitting
        cssCodeSplit: true,
        // Rollup output configuration
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // Normalize path separators for Windows/Unix compatibility
                        const normalizedId = id.replace(/\\/g, '/');
                        
                        // Core React and Inertia
                        if (
                            normalizedId.includes('node_modules/react/') ||
                            normalizedId.includes('node_modules/react-dom/') ||
                            normalizedId.includes('node_modules/@inertiajs/react/')
                        ) {
                            return 'vendor-react';
                        }
                        // Charting libraries
                        if (normalizedId.includes('node_modules/recharts/')) {
                            return 'vendor-charts';
                        }
                        // Drag and drop
                        if (normalizedId.includes('node_modules/@dnd-kit/')) {
                            return 'vendor-dnd';
                        }
                        // Lucide icons
                        if (normalizedId.includes('node_modules/lucide-react/')) {
                            return 'vendor-icons';
                        }
                        // Form handling
                        if (
                            normalizedId.includes('node_modules/react-hook-form/') ||
                            normalizedId.includes('node_modules/@hookform/resolvers/')
                        ) {
                            return 'vendor-forms';
                        }
                        // UI components (Radix)
                        if (normalizedId.includes('node_modules/@radix-ui/')) {
                            return 'vendor-ui';
                        }
                        // Utility libraries
                        if (
                            normalizedId.includes('node_modules/clsx/') ||
                            normalizedId.includes('node_modules/tailwind-merge/') ||
                            normalizedId.includes('node_modules/date-fns/')
                        ) {
                            return 'vendor-utils';
                        }
                    }
                },
                // Consistent chunk naming
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
            },
        },
        // Enable minification using default fast minifier (Oxc)
        minify: true,
        // Source maps for production debugging
        sourcemap: false,
    },
    // Optimize dependencies
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            'lucide-react',
            'clsx',
            'tailwind-merge',
        ],
        exclude: [
            // Exclude heavy libraries that should be lazy loaded
            'recharts',
        ],
    },
    // CSS configuration
    css: {
        devSourcemap: true,
    },
});
