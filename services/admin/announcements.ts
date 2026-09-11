import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ActiveAnnouncement, AnnouncementRow } from "@/types/admin";

export async function listAnnouncements(): Promise<AnnouncementRow[]> {
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function getActiveSiteAnnouncement(): Promise<ActiveAnnouncement | null> {
  const result = await db
    .select()
    .from(announcements)
    .where(eq(announcements.status, "active"))
    .limit(1);

  const row = result[0];
  if (!row) return null;

  return {
    id: row.id,
    message: row.message,
    linkText: row.linkText ?? null,
    linkHref: row.linkHref ?? null,
    variant: row.variant as "default" | "accent" | "destructive",
  };
}

export async function createAnnouncement(input: {
  message: string;
  linkText?: string | null;
  linkHref?: string | null;
  variant: "default" | "accent" | "destructive";
}): Promise<AnnouncementRow> {
  const [row] = await db
    .insert(announcements)
    .values({
      message: input.message,
      linkText: input.linkText ?? null,
      linkHref: input.linkHref ?? null,
      variant: input.variant,
      status: "draft",
    })
    .returning();
  return row;
}

export async function activateAnnouncement(id: number): Promise<void> {
  const existing = await getActiveSiteAnnouncement();
  if (existing) {
    throw new Error("A site announcement is already active — retract it first");
  }

  await db
    .update(announcements)
    .set({ status: "active", activatedAt: new Date() })
    .where(eq(announcements.id, id));

  revalidatePath("/");
}

export async function retractAnnouncement(id: number): Promise<void> {
  await db
    .update(announcements)
    .set({ status: "archived" })
    .where(eq(announcements.id, id));

  revalidatePath("/");
}

export async function deleteAnnouncement(id: number): Promise<void> {
  // Only drafts can be deleted
  const result = await db
    .select({ status: announcements.status })
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  if (!result[0]) return;
  if (result[0].status !== "draft") {
    throw new Error("Only draft announcements can be deleted");
  }

  await db.delete(announcements).where(eq(announcements.id, id));

  revalidatePath("/");
}
