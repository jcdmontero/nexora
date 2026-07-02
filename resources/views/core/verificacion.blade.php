<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación de Documentos - NEXORA</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css" crossOrigin="anonymous" />
    <style>
        :root {
            --bg-gradient-start: #0f172a;
            --bg-gradient-end: #1e1b4b;
            --card-bg: rgba(30, 41, 59, 0.7);
            --card-border: rgba(255, 255, 255, 0.08);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --success: #10b981;
            --success-glow: rgba(16, 185, 129, 0.15);
            --danger: #ef4444;
            --danger-glow: rgba(239, 68, 68, 0.15);
            --accent: #6366f1;
            --border-light: rgba(255, 255, 255, 0.05);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end));
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            line-height: 1.5;
        }

        .container {
            width: 100%;
            max-width: 540px;
            perspective: 1000px;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            overflow: hidden;
            position: relative;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: {{ $valido ? 'var(--success)' : 'var(--danger)' }};
        }

        .logo-area {
            margin-bottom: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
        }

        .logo-area i {
            font-size: 28px;
            color: var(--accent);
        }

        .logo-area span {
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 1px;
            background: linear-gradient(to right, #a5b4fc, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 50px;
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 28px;
            border: 1px solid;
            background: {{ $valido ? 'var(--success-glow)' : 'var(--danger-glow)' }};
            color: {{ $valido ? 'var(--success)' : 'var(--danger)' }};
            border-color: {{ $valido ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }};
            box-shadow: 0 8px 24px {{ $valido ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }};
        }

        .status-badge i {
            font-size: 18px;
        }

        .error-message {
            color: var(--text-muted);
            font-size: 15px;
            margin-bottom: 30px;
            padding: 0 10px;
        }

        .doc-title-main {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 6px;
        }

        .doc-subtitle {
            font-size: 14px;
            color: var(--text-muted);
            margin-bottom: 24px;
        }

        .divider {
            height: 1px;
            background: var(--border-light);
            margin: 20px 0;
        }

        .section-title {
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--accent);
            margin-bottom: 12px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            text-align: left;
        }

        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .info-label {
            color: var(--text-muted);
            font-size: 14px;
        }

        .info-value {
            font-weight: 500;
            font-size: 14px;
            color: var(--text-main);
        }

        .items-list {
            margin-top: 10px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            border: 1px solid var(--border-light);
            overflow: hidden;
        }

        .item-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-light);
            font-size: 13.5px;
        }

        .item-row:last-child {
            border-bottom: none;
        }

        .item-desc {
            color: var(--text-main);
            font-weight: 400;
            text-align: left;
            max-width: 70%;
        }

        .item-qty {
            color: var(--text-muted);
            margin-right: 8px;
        }

        .item-price {
            font-weight: 600;
            color: var(--text-main);
        }

        .total-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            padding: 16px 20px;
            border-radius: 16px;
            margin-top: 24px;
        }

        .total-label {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-main);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .total-val {
            font-size: 22px;
            font-weight: 700;
            color: #a5b4fc;
        }

        .footer-logo {
            margin-top: 32px;
            font-size: 11.5px;
            color: var(--text-muted);
        }

        .footer-logo strong {
            color: var(--text-main);
        }

        .action-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 14px;
            border-radius: 14px;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            font-weight: 600;
            text-decoration: none;
            margin-top: 28px;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
        }

        .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <!-- Header Logo -->
            <div class="logo-area">
                <i class="ti ti-shield-check"></i>
                <span>NEXORA</span>
            </div>

            @if($valido)
                <!-- Valid Document Case -->
                <div class="status-badge">
                    <i class="ti ti-circle-check-filled"></i>
                    <span>Documento Válido & Original</span>
                </div>

                <div class="doc-title-main">{{ $tipo }}</div>
                <div class="doc-subtitle">Nº {{ $numero }} · Emitido el {{ $fecha }}</div>

                <div class="divider"></div>

                <!-- Emisor -->
                <div class="section-title">Emisor (Empresa)</div>
                <div class="info-grid" style="margin-bottom: 20px;">
                    <div class="info-item">
                        <span class="info-label">Razón Social</span>
                        <span class="info-value">{{ $emisor['nombre'] }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">NIT</span>
                        <span class="info-value">{{ $emisor['nit'] }}</span>
                    </div>
                </div>

                <!-- Cliente -->
                <div class="section-title">Cliente</div>
                <div class="info-grid" style="margin-bottom: 20px;">
                    <div class="info-item">
                        <span class="info-label">Nombre / Razón Social</span>
                        <span class="info-value">{{ $cliente['nombre'] }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Identificación</span>
                        <span class="info-value">{{ $cliente['documento'] }}</span>
                    </div>
                </div>

                <!-- Detalle de Conceptos -->
                <div class="section-title">Concepto / Detalle</div>
                <div class="items-list">
                    @foreach($items as $item)
                        <div class="item-row">
                            <div class="item-desc">
                                <span class="item-qty">{{ number_format($item['cantidad'], 0) }}x</span>
                                {{ $item['descripcion'] }}
                            </div>
                            <div class="item-price">$ {{ number_format($item['total'], 0, ',', '.') }}</div>
                        </div>
                    @endforeach
                </div>

                <!-- Total -->
                <div class="total-box">
                    <span class="total-label">Total Documento</span>
                    <span class="total-val">$ {{ number_format($total, 0, ',', '.') }} COP</span>
                </div>
            @else
                <!-- Invalid Document Case -->
                <div class="status-badge" style="margin-bottom: 20px;">
                    <i class="ti ti-circle-x-filled"></i>
                    <span>Documento No Válido</span>
                </div>

                <div class="doc-title-main" style="color: var(--danger); margin-bottom: 12px;">Error de Validación</div>
                <p class="error-message">{{ $mensaje }}</p>

                <div class="divider"></div>
                <p style="font-size: 13.5px; color: var(--text-muted); padding: 10px 0;">
                    Por favor, verifique el código QR impreso o comuníquese con el emisor del documento si cree que esto es un error.
                </p>
            @endif

            <!-- Footer area -->
            <div class="footer-logo">
                Validado digitalmente por <strong>NEXORA Platform</strong>
            </div>
        </div>
    </div>
</body>
</html>
