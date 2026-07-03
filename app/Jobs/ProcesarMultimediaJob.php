<?php

namespace App\Jobs;

use App\Modules\ServiceDesk\Models\OrdenMultimedia;
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
    public $timeout = 120;
    public $maxExceptions = 2;
    public $backoff = [10, 30, 60];

    public function __construct(
        public string $storagePath,
        public string $disk = 'public',
        public ?int $multimediaId = null,
        public ?int $ordenId = null,
        public array $metadata = [],
    ) {
        $this->onQueue('media');
    }

    public function handle(): void
    {
        try {
            if (!Storage::disk($this->disk)->exists($this->storagePath)) {
                Log::error("File not found for multimedia processing", ['path' => $this->storagePath]);
                return;
            }

            $mimeType = Storage::disk($this->disk)->mimeType($this->storagePath);
            $additionalMetadata = $this->metadata;

            if (str_starts_with($mimeType, 'video/')) {
                $duration = $this->extractVideoDuration();
                if ($duration) {
                    $additionalMetadata['duration'] = $duration;
                }
            }

            if (str_starts_with($mimeType, 'image/')) {
                $additionalMetadata['optimized'] = true;
            }

            if ($this->multimediaId) {
                $multimedia = OrdenMultimedia::find($this->multimediaId);
                if ($multimedia) {
                    $multimedia->update(['metadata' => $additionalMetadata]);
                }
            }

            Log::info("Multimedia processing completed", [
                'path' => $this->storagePath,
                'multimedia_id' => $this->multimediaId,
            ]);

        } catch (\Exception $e) {
            Log::error("Multimedia processing failed", [
                'path' => $this->storagePath,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function extractVideoDuration(): ?float
    {
        try {
            $fullPath = Storage::disk($this->disk)->path($this->storagePath);
            $output = shell_exec("ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{$fullPath}\" 2>/dev/null");
            return $output ? (float) trim($output) : null;
        } catch (\Exception $e) {
            Log::warning("Could not extract video duration", ['error' => $e->getMessage()]);
            return null;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Multimedia job failed permanently", [
            'path' => $this->storagePath,
            'error' => $exception->getMessage(),
        ]);
    }
}
