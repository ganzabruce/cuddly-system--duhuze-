import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth/auth";
import { EventForm } from "@/components/events/event-form";
import { createEventFromForm } from "@/actions/events/create-event-from-form";
import { getEventFeatureAccess, getResolvedEntitlements } from "@/lib/services/billing/entitlements";

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const entitlements = await getResolvedEntitlements(user.id);
  const featureAccess = getEventFeatureAccess(entitlements);

  return (
    <div className="w-full min-w-0">
      <EventForm action={createEventFromForm} featureAccess={featureAccess} organizerPhone={user.phoneNumber} />
    </div>
  );
}
