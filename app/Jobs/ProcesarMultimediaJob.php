<?php

namespace App\Jobs;

use App\Modules\ServiceDesk\Services\MultimediaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcesarMultimediaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 120; // 2 minutes
    public $maxExceptions = 2;
    public $backoff = [10, 30, 60];

    public function __construct(
        public string $tempPath, // Temporary file path
        public string $destPath, // Final destination path
        public string $disk = 'public',
        public ?int $ordenId = null,
        public ?int $tenantId = null,
        public array $metadata = []
    ) {
        $this->onQueue('media');
    }

    public function handle(MultimediaService $multimediaService): void
    {
        try {
            Log::info("Processing multimedia file", [
                'temp_path' => $this->tempPath,
                'dest_path' => $this->destPath,
            ]);

            // Check if temp file exists
            if (!Storage::disk('local')->exists($this->tempPath)) {
                Log::error("Temp file not found", ['path' => $this->tempPath]);
                return;
            }

            // Get file info
            $fileContent = Storage::disk('local')->get($this->tempPath);
            $fileSize = strlen($fileContent);
            $mimeType = Storage::disk('local')->mimeType($this->tempPath);

            // Process based on file type
            $processedContent = $fileContent;
            $additionalMetadata = $this->metadata;

            // If it's a video, extract duration
            if (str_starts_with($mimeType, 'video/')) {
                $duration = $this->extractVideoDuration($this->tempPath);
                if ($duration) {
                    $additionalMetadata['duration'] = $duration;
                }
            }

            // If it's an image, optimize
            if (str_starts_with($mimeType, 'image/')) {
                $processedContent = $this->optimizeImage($fileContent, $mimeType);
            }

            // Store to final destination
            Storage::disk($this->disk)->put($this->destPath, $processedContent);

            // Update multimedia record if ordenId provided
            if ($this->ordenId) {
                $this->updateMultimediaRecord($additionalMetadata);
            }

            // Delete temp file
            Storage::disk('local')->delete($this->tempPath);

            Log::info("Multimedia processing completed", [
                'dest_path' => $this->destPath,
                'size' => $fileSize,
            ]);

        } catch (\Exception $e) {
            Log::error("Multimedia processing failed", [
                'temp_path' => $this->tempPath,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function extractVideoDuration(string $path): ?float
    {
        try {
            $fullPath = Storage::disk('local')->path($path);
            $output = shell_exec("ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{$fullPath}\" 2>/dev/null");

            return $output ? (float) trim($output) : null;
        } catch (\Exception $e) {
            Log::warning("Could not extract video duration", ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function optimizeImage(string $content, string $mimeType): string
    {
        // For now, return original content
        // In production, you might use Intervention Image or similar
        return $content;
    }

    private function updateMultimediaRecord(array $metadata): void
    {
        try {
            $multimediaClass = $this->getMultimediaModel();
            if ($multimediaClass) {
                $multimediaClass::where('orden_id', $this->ordenId)
                    ->where('ruta', 'LIKE', '%' . basename($this->destPath) . '%')
                    ->update([
                        'metadata' => $metadata,
                        'tamano' => Storage::disk($this->disk)->size($this->destPath),
                    ]);
            }
        } catch (\Exception $e) {
            Log::warning("Could not update multimedia record", ['error' => $e->getMessage()]);
        }
    }

    private function getMultimediaModel(): ?string
    {
        // Return the appropriate model class
        return \App\Modules\ServiceDesk\Models\OrdenMultimedia::class;
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Multimedia job failed permanently", [
            'temp_path' => $this->tempPath,
            'dest_path' => $this->destPath,
            'error' => $exception->getMessage(),
        ]);

        // Clean up temp file on permanent failure
        try {
            Storage::disk('local')->delete($this->tempPath);
        } catch (\Exception $e) {
            // Ignore cleanup errors
        }
    }
}
