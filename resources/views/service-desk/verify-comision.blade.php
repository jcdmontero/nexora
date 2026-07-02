<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verificación de Liquidación - NEXORA</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans">
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div class="bg-indigo-600 p-6 text-center text-white">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h1 class="text-2xl font-bold">Documento Verificado</h1>
                <p class="text-indigo-100 text-sm mt-1">Este documento ha sido validado contra los registros oficiales de NEXORA</p>
            </div>

            <div class="p-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div class="space-y-1">
                        <p class="text-xs text-slate-500 uppercase font-semibold tracking-wider">Código de Liquidación</p>
                        <p class="text-lg font-mono font-bold text-slate-800">{{ $liquidacion->codigo }}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-slate-500 uppercase font-semibold tracking-wider">Estado</p>
                        <p class="text-lg font-bold {{ $liquidacion->estado === 'PAGADO' ? 'text-emerald-600' : 'text-amber-600' }}">
                            {{ $liquidacion->estado }}
                        </p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-slate-500 uppercase font-semibold tracking-wider">Prestador</p>
                        <p class="text-lg font-semibold text-slate-800">{{ $liquidacion->prestador->nombre_completo }}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-slate-500 uppercase font-semibold tracking-wider">Total Liquidado</p>
                        <p class="text-lg font-bold text-slate-800">${{ number_format($liquidacion->total_comisiones, 0, ',', '.') }}</p>
                    </div>
                </div>

                <div class="border-t border-slate-100 pt-6">
                    <p class="text-center text-xs text-slate-400">
                        Este comprobante es una validación electrónica. Para cualquier duda, contacte con la administración de la empresa.
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
