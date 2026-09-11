"use server";

import { requireAdmin } from "@/actions/admin/auth";
import {
  listAnnouncements,
  getActiveSiteAnnouncement,
  createAnnouncement,
  activateAnnouncement,
  retractAnnouncement,
  deleteAnnouncement,
} from "@/lib/services/admin/announcements";
import { logAdminAction } from "@/lib/services/admin/audit-log";

// PUBLIC ACTION — no auth by design (site-wide banner shown on public pages)
export async function getActiveSiteAnnouncementAction() {
  return getActiveSiteAnnouncement();
}

export async function listAnnouncementsAction() {
  await requireAdmin();
  return listAnnouncements();
}

export async function createAnnouncementAction(input: {
  message: string;
  linkText?: string | null;
  linkHref?: string | null;
  variant: "default" | "accent" | "destructive";
}): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  if (!input.message.trim()) {
    return { success: false, error: "Message is required" };
  }

  try {
    const row = await createAnnouncement(input);
    await logAdminAction({
      adminEmail: admin.email,
      action: "announcement.create",
      targetId: String(row.id),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create" };
  }
}

export async function activateAnnouncementAction(id: number): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  try {
    await activateAnnouncement(id);
    await logAdminAction({
      adminEmail: admin.email,
      action: "announcement.activate",
      targetId: String(id),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to activate" };
  }
}

export async function retractAnnouncementAction(id: number): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  try {
    await retractAnnouncement(id);
    await logAdminAction({
      adminEmail: admin.email,
      action: "announcement.retract",
      targetId: String(id),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to retract" };
  }
}

export async function deleteAnnouncementAction(id: number): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  try {
    await deleteAnnouncement(id);
    await logAdminAction({
      adminEmail: admin.email,
      action: "announcement.delete",
      targetId: String(id),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete" };
  }
}
