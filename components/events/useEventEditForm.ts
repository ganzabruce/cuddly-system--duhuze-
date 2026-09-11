import { useRef, useState } from "react";
import { toast } from "sonner";
import { updateEvent, updateEventSettings } from "@/actions/events/mutations";
import {
  getEventEndedAt,
  normalizeStatusValue,
} from "@/lib/utils/event-status";
import type { DashboardEvent } from "@/types/events";

export function useEventEditForm({
  localEvent,
  setLocalEvent,
  eventDate,
  eventEndDate,
}: {
  localEvent: DashboardEvent;
  setLocalEvent: (updater: (prev: DashboardEvent) => DashboardEvent) => void;
  eventDate: Date;
  eventEndDate: Date | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editFormRef = useRef<HTMLFormElement>(null);
  const [editVisibility, setEditVisibility] = useState<"private" | "public">(
    (localEvent.visibility as "private" | "public") ?? "private",
  );

  const handleUpdateEvent = async (formData: FormData) => {
    const visibility = formData.get("visibility") as string;
    const category = formData.get("category") as string;
    if (visibility === "public" && !category) {
      toast.error("Please select a category for public events.");
      return;
    }
    setIsSavingEdit(true);
    // Carry over existing settings fields that are no longer in the edit form
    formData.set("image", localEvent.image ?? "");
    formData.set("imageFormat", localEvent.imageFormat ?? "square");
    formData.set("status", localEvent.status);
    formData.set(
      "contributionCollectionMode",
      localEvent.contributionCollectionMode ?? "offline",
    );
    formData.set(
      "rsvpAccessMode",
      localEvent.rsvpAccessMode ?? "open_rsvp",
    );
    formData.set(
      "maxCapacity",
      localEvent.guestCapacity != null ? String(localEvent.guestCapacity) : "",
    );
    formData.set(
      "contributionAmount",
      localEvent.contributionAmount != null
        ? String(localEvent.contributionAmount)
        : "",
    );
    formData.set(
      "contributionPaymentInfo",
      localEvent.contributionPaymentInfo ?? "",
    );
    formData.set(
      "requireApproval",
      localEvent.requireApproval ? "true" : "false",
    );
    formData.set(
      "allowAdditionalGuests",
      localEvent.allowAdditionalGuests ? "true" : "false",
    );
    formData.set(
      "maxAdditionalGuests",
      localEvent.maxAdditionalGuests != null
        ? String(localEvent.maxAdditionalGuests)
        : "",
    );
    formData.set(
      "customRsvpQuestions",
      JSON.stringify(localEvent.customQuestions ?? []),
    );
    formData.set(
      "attendeeCategories",
      JSON.stringify(localEvent.attendeeCategories ?? []),
    );

    const result = await updateEvent(localEvent.id, formData);
    if (result?.error) {
      toast.error(result.error);
      setIsSavingEdit(false);
      return;
    }
    const nextDate = new Date(String(formData.get("date") ?? localEvent.date));
    const nextEndDate = formData.get("endDate")
      ? new Date(String(formData.get("endDate")))
      : null;
    const nextRawStatus = localEvent.status;
    const sanitizedStatus =
      nextRawStatus === "completed" ? "published" : nextRawStatus;
    const eventEndedAt = getEventEndedAt({
      date: nextDate,
      endDate: nextEndDate,
      status: sanitizedStatus,
    });
    const normalizedStatus =
      normalizeStatusValue(sanitizedStatus, eventEndedAt) ?? sanitizedStatus;

    const nextEvent: DashboardEvent = {
      ...localEvent,
      title: (formData.get("title") as string) || localEvent.title,
      description: (formData.get("description") as string) || null,
      category: (formData.get("category") as string) || null,
      date: nextDate,
      endDate: nextEndDate,
      locationType:
        ((formData.get("locationType") as string) === "in_person"
          ? "in_person"
          : "online") as "online" | "in_person",
      locationName:
        (formData.get("locationType") as string) === "in_person"
          ? ((formData.get("locationName") as string) || "")
          : "Online",
      locationLink: (formData.get("locationLink") as string) || null,
      visibility:
        (formData.get("visibility") as string) || localEvent.visibility,
      status: normalizedStatus,
    };
    setLocalEvent(() => nextEvent);
    setIsSavingEdit(false);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editFormRef.current) return;
    const formData = new FormData(editFormRef.current);
    await handleUpdateEvent(formData);
  };

  const handleSaveSettings = async (
    settings: Parameters<typeof updateEventSettings>[1],
  ) => {
    const result = await updateEventSettings(localEvent.id, settings);
    if (result.error) return result;

    // Update local state with the new settings
    const sanitizedStatus =
      settings.status === "completed" ? "published" : settings.status;
    const eventEndedAt = getEventEndedAt({
      date: eventDate,
      endDate: eventEndDate,
      status: sanitizedStatus,
    });
    const normalizedStatus =
      normalizeStatusValue(sanitizedStatus, eventEndedAt) ?? sanitizedStatus;

    setLocalEvent((prev) => ({
      ...prev,
      status: normalizedStatus,
      guestCapacity: settings.maxCapacity,
      rsvpAccessMode: settings.rsvpAccessMode,
      requireApproval: settings.requireApproval,
      allowAdditionalGuests: settings.allowAdditionalGuests,
      maxAdditionalGuests: settings.maxAdditionalGuests,
      contributionCollectionMode: settings.contributionCollectionMode,
      contributionAmount: settings.contributionAmount,
      contributionPaymentInfo: settings.contributionPaymentInfo,
      customQuestions: settings.customQuestions ?? [],
      attendeeCategories: settings.attendeeCategories ?? [],
      whatsappEnabled: settings.whatsappEnabled ?? prev.whatsappEnabled,
    }));

    return {};
  };

  return {
    isEditing,
    setIsEditing,
    isSavingEdit,
    editFormRef,
    editVisibility,
    setEditVisibility,
    handleUpdateEvent,
    handleSaveEdit,
    handleSaveSettings,
  };
}
