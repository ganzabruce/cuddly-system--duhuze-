"use client";

import { useActionState, useRef, useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DocumentIcon,
  FilmIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { useUploadThing } from "@/lib/storage/client";
import { submitSupportForm } from "@/actions/marketing/actions";
import type { FormState } from "@/types/marketing";
import {
  SUPPORT_CATEGORIES,
} from "@/components/marketing/support-content";

const MAX_FILES = 3;
const MAX_MB = 16;

type UploadedFile = { url: string; name: string };
type PendingFile = { id: string; file: File; preview?: string; progress: number; error?: string };

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return FilmIcon;
  if (["pdf"].includes(ext)) return DocumentIcon;
  return PhotoIcon;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const initialState: FormState = { success: false };

type SupportFormProps = {
  defaultName?: string;
  defaultEmail?: string;
};

export function SupportForm({ defaultName = "", defaultEmail = "" }: SupportFormProps) {
  const [state, formAction, pending] = useActionState(submitSupportForm, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const { startUpload } = useUploadThing("supportAttachment", {
    onUploadProgress: (progress) => {
      setPendingFiles((prev) => prev.map((f) => ({ ...f, progress })));
    },
    onClientUploadComplete: (res) => {
      const done = res?.map((r) => ({ url: r.ufsUrl, name: r.name })) ?? [];
      setUploaded((prev) => [...prev, ...done]);
      setPendingFiles([]);
      setUploading(false);
    },
    onUploadError: (err) => {
      setPendingFiles((prev) => prev.map((f) => ({ ...f, error: err.message, progress: 0 })));
      setUploading(false);
    },
  });

  const [prevSubmitSuccess, setPrevSubmitSuccess] = useState(state.success);
  if (prevSubmitSuccess !== state.success) {
    setPrevSubmitSuccess(state.success);
    if (state.success) {
      setPendingFiles([]);
      setUploaded([]);
    }
  }

  useEffect(() => {
    if (!state.success) return;
    formRef.current?.reset();
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
  }, [state.success]);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      const remaining = MAX_FILES - uploaded.length - pendingFiles.length;
      if (remaining <= 0) return;

      const valid = arr.slice(0, remaining).filter((f) => {
        const ok = f.size <= MAX_MB * 1024 * 1024;
        return ok;
      });
      if (!valid.length) return;

      const previews: PendingFile[] = valid.map((file) => {
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
        if (preview) previewUrlsRef.current.add(preview);
        return { id: crypto.randomUUID(), file, preview, progress: 0 };
      });
      setPendingFiles((prev) => [...prev, ...previews]);
      setUploading(true);
      await startUpload(valid);
    },
    [uploaded.length, pendingFiles.length, startUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      void addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const removeUploaded = (url: string) => {
    setUploaded((prev) => prev.filter((f) => f.url !== url));
  };

  const removePending = (id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((pf) => pf.id === id);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
        previewUrlsRef.current.delete(target.preview);
      }
      return prev.filter((pf) => pf.id !== id);
    });
  };

  const totalFiles = uploaded.length + pendingFiles.length;
  const canAddMore = totalFiles < MAX_FILES && !uploading;

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="attachments" value={JSON.stringify(uploaded)} readOnly />
      {state.success && (
        <div className="mb-6 rounded-md border border-success/30 bg-success/6 px-4 py-3 text-sm text-success">
          Request submitted! We&apos;ve sent a confirmation to your email.
        </div>
      )}
      {state.error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/6 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div>
          <label htmlFor="support-name" className="block text-sm font-semibold text-foreground">Name</label>
          <div className="mt-2">
            <Input id="support-name" name="name" placeholder="Your name" defaultValue={defaultName} required minLength={2} />
          </div>
          {state.fieldErrors?.name && <p className="mt-1.5 text-xs text-destructive">{state.fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="support-email" className="block text-sm font-semibold text-foreground">Email</label>
          <div className="mt-2">
            <Input id="support-email" name="email" type="email" placeholder="you@example.com" defaultValue={defaultEmail} required />
          </div>
          {state.fieldErrors?.email && <p className="mt-1.5 text-xs text-destructive">{state.fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="support-category" className="block text-sm font-semibold text-foreground">Issue category</label>
          <div className="mt-2">
            <select
              id="support-category"
              name="category"
              required
              defaultValue=""
              className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-all duration-200 hover:border-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select a category</option>
              {SUPPORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {state.fieldErrors?.category && <p className="mt-1.5 text-xs text-destructive">{state.fieldErrors.category}</p>}
        </div>

        <div>
          <label htmlFor="support-event" className="block text-sm font-semibold text-foreground">
            Event name or URL <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <div className="mt-2">
            <Input id="support-event" name="eventRef" placeholder="e.g. My Birthday Party or a link" />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="support-message" className="block text-sm font-semibold text-foreground">Describe your issue</label>
          <div className="mt-2">
            <Textarea id="support-message" name="message" placeholder="Tell us what happened and what you expected..." required minLength={10} rows={5} />
          </div>
          {state.fieldErrors?.message && <p className="mt-1.5 text-xs text-destructive">{state.fieldErrors.message}</p>}
        </div>

        {/* Upload zone */}
        <div className="sm:col-span-2">
          <div className="flex items-baseline justify-between">
            <label className="block text-sm font-semibold text-foreground">
              Attachments <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <span className="text-xs text-muted-foreground">{totalFiles}/{MAX_FILES} · max {MAX_MB}MB each · images, video, PDF</span>
          </div>

          <div className="mt-2 space-y-2">
            {/* Drop zone */}
            {canAddMore && (
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-8 transition-all duration-200 ${
                  dragging
                    ? "border-accent bg-accent/5 scale-[1.01]"
                    : "border-border hover:border-accent/60 hover:bg-accent/3"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf"
                  className="hidden"
                  onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = ""; }}
                />
                <div className={`rounded-full p-2.5 transition-colors duration-200 ${dragging ? "bg-accent/15" : "bg-muted group-hover:bg-accent/10"}`}>
                  <ArrowUpTrayIcon className={`h-5 w-5 transition-colors duration-200 ${dragging ? "text-accent" : "text-muted-foreground group-hover:text-accent/80"}`} />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-medium transition-colors duration-200 ${dragging ? "text-accent" : "text-foreground"}`}>
                    {dragging ? "Drop to attach" : "Click or drag files here"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Images · Video · PDF - up to {MAX_MB}MB each
                  </p>
                </div>
              </div>
            )}

            {/* File chips */}
            {(uploaded.length > 0 || pendingFiles.length > 0) && (
              <ul className="space-y-2">
                {uploaded.map((f) => {
                  const Icon = fileIcon(f.name);
                  return (
                    <li key={f.url} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-accent/10">
                        <Icon className="h-4 w-4 text-accent" />
                      </div>
                      <span className="flex-1 truncate text-sm text-foreground">{f.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Uploaded</Badge>
                        <button
                          type="button"
                          onClick={() => removeUploaded(f.url)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}

                {pendingFiles.map((pf) => {
                  const Icon = fileIcon(pf.file.name);
                  return (
                    <li key={pf.id} className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                          {pf.preview
                            ? <img src={pf.preview} alt="" className="h-8 w-8 rounded object-cover" />
                            : <Icon className="h-4 w-4 text-muted-foreground" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm text-foreground">{pf.file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(pf.file.size)}</p>
                        </div>
                        {pf.error ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Upload failed</Badge>
                            <button
                              type="button"
                              onClick={() => removePending(pf.id)}
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label="Remove file"
                            >
                              <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{pf.progress}%</span>
                        )}
                      </div>
                      {!pf.error && (
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-accent transition-all duration-300"
                            style={{ width: `${pf.progress}%` }}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button type="submit" variant="default" size="lg" disabled={pending || uploading} className="w-full">
          {uploading ? "Uploading files..." : pending ? "Submitting..." : "Submit support request"}
        </Button>
      </div>
    </form>
  );
}
