<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GeneratePwaIcons extends Command
{
    protected $signature = 'pwa:icons';
    protected $description = 'Generar iconos PNG para PWA (192x192, 512x512, 180x180 apple-touch-icon)';

    public function handle(): int
    {
        if (!function_exists('imagecreatetruecolor')) {
            $this->error('PHP GD no está habilitado. Instala php-gd o habilita la extensión en php.ini.');
            return 1;
        }

        $iconsDir = public_path('icons');
        if (!is_dir($iconsDir)) {
            mkdir($iconsDir, 0755, true);
        }

        $sizes = [
            'icon-192x192.png' => 192,
            'icon-512x512.png' => 512,
            'apple-touch-icon.png' => 180,
        ];

        foreach ($sizes as $filename => $size) {
            $this->generateIcon($iconsDir . '/' . $filename, $size);
            $this->info("  Creado: icons/{$filename} ({$size}x{$size})");
        }

        $this->newLine();
        $this->info('Iconos PWA generados correctamente.');
        return 0;
    }

    private function generateIcon(string $path, int $size): void
    {
        $img = imagecreatetruecolor($size, $size);

        // Fondo: azul primario #2563EB
        $bg = imagecolorallocate($img, 37, 99, 235);
        imagefill($img, 0, 0, $bg);

        // Borde redondeado simulado (esquinas más oscuras)
        $dark = imagecolorallocate($img, 29, 78, 216);
        $radius = (int) ($size * 0.15);

        // Superior izquierda
        imagefilledrectangle($img, 0, 0, $radius, $radius, $dark);
        imagefill($img, $radius / 2, $radius / 2, $bg);

        // Superior derecha
        imagefilledrectangle($img, $size - $radius, 0, $size, $radius, $dark);
        imagefill($img, $size - $radius / 2, $radius / 2, $bg);

        // Inferior izquierda
        imagefilledrectangle($img, 0, $size - $radius, $radius, $size, $dark);
        imagefill($img, $radius / 2, $size - $radius / 2, $bg);

        // Inferior derecha
        imagefilledrectangle($img, $size - $radius, $size - $radius, $size, $size, $dark);
        imagefill($img, $size - $radius / 2, $size - $radius / 2, $bg);

        // Letra "N" blanca
        $white = imagecolorallocate($img, 255, 255, 255);
        $fontSize = (int) ($size * 0.45);
        $font = $this->getFontPath();

        if ($font && function_exists('imagettftext')) {
            $bbox = imagettfbbox($fontSize, 0, $font, 'N');
            $textWidth = abs($bbox[4] - $bbox[0]);
            $textHeight = abs($bbox[5] - $bbox[1]);
            $x = (int) (($size - $textWidth) / 2);
            $y = (int) (($size + $textHeight) / 2);
            imagettftext($img, $fontSize, 0, $x, $y, $white, $font, 'N');
        } else {
            // Fallback: usar imagestring con tamaño máximo
            $x = (int) (($size - $fontSize) / 2);
            $y = (int) (($size - $fontSize * 0.6) / 2);
            imagestring($img, 5, $x, $y, 'N', $white);
        }

        imagepng($img, $path);
        imagedestroy($img);
    }

    private function getFontPath(): ?string
    {
        // Buscar fuentes comunes en Windows
        $fonts = [
            'C:/Windows/Fonts/arial.ttf',
            'C:/Windows/Fonts/segoeui.ttf',
            'C:/Windows/Fonts/calibri.ttf',
            'C:/Windows/Fonts/tahoma.ttf',
        ];

        foreach ($fonts as $font) {
            if (file_exists($font)) {
                return $font;
            }
        }

        return null;
    }
}
