"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  CheckIcon,
  ClipboardDocumentIcon,
  ArrowUpTrayIcon,
  QrCodeIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useUploadThing } from "@/lib/storage/client";
import { getPublicEventPath } from "@/lib/constants/events/profile-paths";
import { getTimezoneAbbr } from "@/lib/utils/format";
import type { ImageFormat } from "@/types/events";
import { FlyerImage } from "@/components/events/FlyerImage";
import { detectFormatFromFile } from "@/components/events/detect-flyer-format";

interface EventDetailRightProps {
  image: string | null;
  title: string;
  baseUrl: string;
  username: string;
  currentSlug: string;
  editSlug: string;
  onSlugChange: (val: string) => void;
  onSaveSlug: () => void;
  isSavingSlug: boolean;
  copied: boolean;
  onCopyLink: () => void;
  onImageChange: (url: string, imageFormat?: ImageFormat) => Promise<void>;
  imageFormat?: ImageFormat;
  publicUrl: string;
  eventDate: Date;
  endDate: Date | null;
  timezone: string;
  visibility: "public" | "private";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px bg-border/50" />;
}

export function EventDetailRight({
  image,
  title,
  baseUrl,
  username,
  currentSlug,
  editSlug,
  onSlugChange,
  onSaveSlug,
  isSavingSlug,
  copied,
  onCopyLink,
  onImageChange,
  imageFormat = "square",
  publicUrl,
  eventDate,
  endDate,
  timezone,
  visibility,
}: EventDetailRightProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [detectedFormat, setDetectedFormat] = useState<ImageFormat>(imageFormat);
  const detectedFormatRef = useRef<ImageFormat>(imageFormat);

  const { startUpload } = useUploadThing("eventImage", {
    onClientUploadComplete: async (res) => {
      if (res?.[0]) {
        const uploadedUrl =
          res[0].serverData?.url ?? res[0].ufsUrl;

        if (!uploadedUrl) {
          toast.error("Upload completed but no file URL was returned");
          setIsUploading(false);
          setPreviewUrl("");
          return;
        }

        await onImageChange(uploadedUrl, detectedFormatRef.current);
        setPreviewUrl("");
      }
      setIsUploading(false);
    },
    onUploadError: (err) => {
      toast.error(err.message || "Failed to upload image");
      setIsUploading(false);
      setPreviewUrl("");
    },
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Image must be less than 8MB");
        return;
      }
      const { format, previewUrl } = await detectFormatFromFile(file);
      detectedFormatRef.current = format;
      setDetectedFormat(format);
      setPreviewUrl(previewUrl);
      setIsUploading(true);
      const result = await startUpload([file]);
      if (!result?.[0]) {
        toast.error("Upload did not return a file");
        setIsUploading(false);
        setPreviewUrl("");
      }
      URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [startUpload],
  );

  const displayImage = previewUrl || image;

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(publicUrl, {
      margin: 2,
      width: 320,
      color: { dark: "#1A1412", light: "#faf9f6" },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [publicUrl]);

  return (
    <div className="flex flex-col gap-5 overflow-y-auto rounded-md border-2 border-border-subtle bg-card p-5">

      {/* Cover image — upload enabled */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="group block w-full overflow-hidden rounded-md border border-border-subtle"
      >
        {displayImage ? (
          <FlyerImage
            image={displayImage}
            imageFormat={previewUrl ? detectedFormat : imageFormat}
            title={title}
            sizes="30vw"
          >
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
              <div className="flex items-center gap-1.5 rounded-sm bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                Change photo
              </div>
            </div>
          </FlyerImage>
        ) : (
          <div
            className="flex w-full flex-col items-center justify-center gap-2 bg-muted"
            style={{ aspectRatio: "1/1" }}
          >
            <ArrowUpTrayIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Add event picture</span>
          </div>
        )}
      </button>

      <Divider />

      {/* Event Link & QR */}
      <div>
        <SectionLabel>Event Link</SectionLabel>

        <div className="mb-3 flex flex-col space-y-1.5">
          <div className="flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-background px-3 focus-within:border-primary transition-colors">
            <span
              className="shrink-0 text-xs text-muted-foreground"
              title={`${baseUrl}${getPublicEventPath(username, "")}`}
            >
              {baseUrl}{getPublicEventPath(username, "")}
            </span>
            <input
              id="event-slug"
              style={{ width: `${Math.max(editSlug.length || 8, 4)}ch` }}
              className="min-w-0 flex-1 bg-transparent px-1 text-left text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
              placeholder="my-event"
              autoCorrect="off"
              spellCheck={false}
              value={editSlug}
              onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            />
          </div>

          <div className="flex items-center justify-between px-0.5">
            <p className="text-xs text-muted-foreground">Used in your event URLs</p>
            <div className="flex shrink-0 items-center gap-2">
              {editSlug.trim() !== currentSlug && (
                <button
                  type="button"
                  onClick={onSaveSlug}
                  disabled={isSavingSlug}
                  className="text-xs font-semibold text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {isSavingSlug ? "Saving…" : "Save"}
                </button>
              )}
              <button
                type="button"
                onClick={onCopyLink}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied ? (
                  <CheckIcon className="h-3 w-3 text-success" />
                ) : (
                  <ClipboardDocumentIcon className="h-3 w-3" />
                )}
                {copied ? <span className="text-success">Copied</span> : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {qrDataUrl && (
          <a
            href={qrDataUrl}
            download={`${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-qr.png`}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <QrCodeIcon className="h-4 w-4 text-muted-foreground" />
            Download QR code
          </a>
        )}
      </div>

      <Divider />

      {/* Event details */}
      <div>
        <SectionLabel>Event details</SectionLabel>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <CalendarDaysIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">
                {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: timezone })}
              </p>
              <p className="text-xs text-muted-foreground">
                {eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: timezone })}
                {endDate && (
                  <> &ndash; {endDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: timezone,
                    ...(endDate.toDateString() !== eventDate.toDateString() && { month: "short", day: "numeric" }),
                  })}</>
                )}
                {(() => { const abbr = getTimezoneAbbr(eventDate, timezone); return abbr ? ` (${abbr})` : null; })()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {visibility === "public" ? (
              <GlobeAltIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <LockClosedIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <p className="text-xs text-foreground capitalize">{visibility}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
