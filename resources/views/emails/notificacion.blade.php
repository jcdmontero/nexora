<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $titulo ?? 'Notificación' }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
                    {{-- Encabezado con logo o nombre de la empresa --}}
                    <tr>
                        <td style="background-color:#4f46e5;padding:24px 28px;text-align:center;">
                            @if(!empty($logo))
                                <img src="{{ $logo }}" alt="{{ $empresa }}" style="max-height:48px;max-width:200px;object-fit:contain;">
                            @else
                                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">{{ $empresa }}</span>
                            @endif
                        </td>
                    </tr>
                    {{-- Cuerpo --}}
                    <tr>
                        <td style="padding:32px 28px;">
                            @if(!empty($titulo))
                                <h1 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0f172a;">{{ $titulo }}</h1>
                            @endif
                            <div style="font-size:15px;line-height:1.6;color:#334155;white-space:pre-line;">{{ $cuerpo }}</div>
                        </td>
                    </tr>
                    {{-- Pie --}}
                    <tr>
                        <td style="padding:18px 28px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                            <p style="margin:0;font-size:12px;color:#94a3b8;">
                                Este es un mensaje automático de {{ $empresa }}. Por favor no respondas a este correo.
                            </p>
                        </td>
                    </tr>
                </table>
                <p style="margin:16px 0 0;font-size:11px;color:#cbd5e1;">Enviado con NEXORA</p>
            </td>
        </tr>
    </table>
</body>
</html>
