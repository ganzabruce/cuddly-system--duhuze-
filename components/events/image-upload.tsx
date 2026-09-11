"use client";

import { useState, useRef, useCallback } from "react";
import { useUploadThing } from "@/lib/storage/client";

import { XMarkIcon, ArrowUpTrayIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import type { ImageFormat } from "@/types/events";
import { FlyerImage } from "@/components/events/FlyerImage";
import { detectFormatFromFile } from "@/components/events/detect-flyer-format";

interface ImageUploadProps {
    onImageUpload: (url: string) => void;
    defaultImageUrl?: string;
    /** When "large", the drop zone / preview fills its container. */
    size?: "default" | "large";
    /** The currently detected format, used to frame the preview. */
    imageFormat?: ImageFormat;
    /** Fired once a file's natural dimensions are read, before upload completes. */
    onFormatDetected?: (format: ImageFormat) => void;
}

export function ImageUpload({
    onImageUpload,
    defaultImageUrl = "",
    size = "default",
    imageFormat = "square",
    onFormatDetected,
}: ImageUploadProps) {
    const [imageUrl, setImageUrl] = useState<string>(defaultImageUrl);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { startUpload } = useUploadThing("eventImage", {
        onClientUploadComplete: (res) => {
            if (res && res[0]) {
                const url = res[0].serverData?.url ?? res[0].ufsUrl;
                if (!url) {
                    setError("Upload completed but no file URL was returned");
                    setIsUploading(false);
                    setPreviewUrl("");
                    setUploadProgress(0);
                    return;
                }
                setImageUrl(url);
                setPreviewUrl("");
                onImageUpload(url);
            }
            setIsUploading(false);
            setUploadProgress(0);
        },
        onUploadError: (err) => {
            setError(err.message);
            setIsUploading(false);
            setPreviewUrl("");
            setUploadProgress(0);
        },
        onUploadProgress: (progress) => {
            setUploadProgress(progress);
        },
    });

    const handleFile = useCallback(
        async (file: File) => {
            setError(null);

            if (!file.type.startsWith("image/")) {
                setError("Please select an image file");
                return;
            }
            if (file.size > 8 * 1024 * 1024) {
                setError("Image must be less than 8MB");
                return;
            }

            const { format, previewUrl } = await detectFormatFromFile(file);
            onFormatDetected?.(format);
            setPreviewUrl(previewUrl);
            setIsUploading(true);

            await startUpload([file]);

            URL.revokeObjectURL(previewUrl);
        },
        [startUpload, onFormatDetected],
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
        },
        [handleFile],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
        },
        [handleFile],
    );

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeImage = () => {
        setImageUrl("");
        setPreviewUrl("");
        onImageUpload("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const displayUrl = imageUrl || previewUrl;

    return (
        <div className="flex h-full flex-col">
            {displayUrl ? (
                <FlyerImage
                    image={displayUrl}
                    imageFormat={imageFormat}
                    title="Event preview"
                    alt="Event preview"
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="rounded-md border border-input"
                >
                    {isUploading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/50">
                            <div className="h-2 w-3/4 max-w-xs overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full rounded-full bg-white transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-white">
                                Uploading… {uploadProgress}%
                            </span>
                        </div>
                    )}

                    {!isUploading && (
                        <button
                            type="button"
                            className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 shadow-lg transition-colors hover:bg-black/80"
                            onClick={removeImage}
                            aria-label="Remove image"
                        >
                            <XMarkIcon className="h-5 w-5 text-white" />
                        </button>
                    )}
                </FlyerImage>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={cn(
                        "group relative flex cursor-pointer flex-col items-center justify-center rounded-md p-8 transition-colors hover:bg-primary/5",
                        size === "large" ? "aspect-square w-full" : "min-h-[200px]",
                    )}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="rounded-full bg-primary/10 p-3 transition-transform group-hover:scale-105">
                        <ArrowUpTrayIcon className="h-8 w-8 text-primary" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">
                        Click to upload or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        PNG, JPG, JPEG up to 8MB
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                        <PhotoIcon className="h-3.5 w-3.5" />
                        Square or portrait flyers look best
                    </p>
                </div>
            )}

            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
    );
}
