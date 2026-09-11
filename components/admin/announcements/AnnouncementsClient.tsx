"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAnnouncementAction,
  activateAnnouncementAction,
  retractAnnouncementAction,
  deleteAnnouncementAction,
} from "@/actions/admin/announcements";
import type { AnnouncementRow } from "@/types/admin";

type Props = {
  initialAnnouncements: AnnouncementRow[];
};

const VARIANT_LABELS: Record<string, string> = {
  default: "Default",
  accent: "Accent",
  destructive: "Destructive",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success-surface text-success-deep",
  archived: "bg-muted text-muted-foreground",
};

export function AnnouncementsClient({ initialAnnouncements }: Props) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [prevInitialAnnouncements, setPrevInitialAnnouncements] = useState(initialAnnouncements);
  if (prevInitialAnnouncements !== initialAnnouncements) {
    setPrevInitialAnnouncements(initialAnnouncements);
    setAnnouncements(initialAnnouncements);
  }
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkHref, setLinkHref] = useState("");
  const [variant, setVariant] = useState<"default" | "accent" | "destructive">("accent");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const refresh = () => {
    router.refresh();
  };

  const handleCreate = async () => {
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }
    setIsSaving(true);
    try {
      const result = await createAnnouncementAction({
        message: message.trim(),
        linkText: linkText.trim() || null,
        linkHref: linkHref.trim() || null,
        variant,
      });
      if (!result.success) throw new Error(result.error);
      toast.success("Announcement created");
      setMessage("");
      setLinkText("");
      setLinkHref("");
      setShowForm(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (id: number) => {
    const result = await activateAnnouncementAction(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to activate");
    } else {
      toast.success("Announcement is now live");
      refresh();
    }
  };

  const handleRetract = async (id: number) => {
    const result = await retractAnnouncementAction(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to retract");
    } else {
      toast.success("Announcement retracted");
      refresh();
    }
  };

  const handleDelete = async (id: number) => {
    const result = await deleteAnnouncementAction(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete");
    } else {
      toast.success("Announcement deleted");
      setConfirmDeleteId(null);
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {announcements.length === 0 ? "No announcements yet." : `${announcements.length} announcement${announcements.length !== 1 ? "s" : ""}`}
        </p>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            New announcement
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-md border border-border bg-muted/30 p-4 space-y-4">
          <p className="text-sm font-medium text-foreground">New announcement</p>
          <div className="space-y-2">
            <Label htmlFor="ann-message">Message</Label>
            <Textarea
              id="ann-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Your announcement text..."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ann-link-text">Link text (optional)</Label>
              <Input
                id="ann-link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Learn more"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-link-href">Link URL (optional)</Label>
              <Input
                id="ann-link-href"
                value={linkHref}
                onChange={(e) => setLinkHref(e.target.value)}
                placeholder="/pricing"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-variant">Style</Label>
            <Select value={variant} onValueChange={(v) => setVariant(v as typeof variant)}>
              <SelectTrigger id="ann-variant" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="accent">Accent</SelectItem>
                <SelectItem value="destructive">Destructive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={isSaving} onClick={handleCreate}>
              {isSaving ? "Saving..." : "Save draft"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {announcements.length > 0 && (
        <div className="divide-y divide-border rounded-md border border-border">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between ${ann.status === "active" ? "bg-success-surface/40" : ""}`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[ann.status]}`}>
                    {ann.status}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {VARIANT_LABELS[ann.variant]}
                  </span>
                </div>
                <p className="text-sm text-foreground">{ann.message}</p>
                {ann.linkText && ann.linkHref && (
                  <p className="text-xs text-muted-foreground">
                    Link: {ann.linkText} → {ann.linkHref}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : "—"}
                  {ann.activatedAt ? ` · Activated ${new Date(ann.activatedAt).toLocaleDateString()}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {ann.status === "draft" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleActivate(ann.id)}>
                      Activate
                    </Button>
                    {confirmDeleteId === ann.id ? (
                      <>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(ann.id)}>
                          Confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(ann.id)}>
                        Delete
                      </Button>
                    )}
                  </>
                )}
                {ann.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => handleRetract(ann.id)}>
                    Retract
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
