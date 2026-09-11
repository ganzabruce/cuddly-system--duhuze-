import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth/auth";
import { getEventExportData } from "@/actions/events/get-event-export-data";
import { withApiHandler } from "@/lib/utils/api-handler";

type Params = { params: Promise<{ eventId: string }> };

export const GET = withApiHandler("get event export data", async (_request, context: Params) => {
  const user = await getCurrentUser();
  if (!user || user.status === "suspended") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId: eventIdParam } = await context.params;
  const eventId = Number.parseInt(eventIdParam, 10);
  if (Number.isNaN(eventId)) {
    return NextResponse.json(
      { error: "Invalid event ID", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const data = await getEventExportData(eventId, user.id);

  return NextResponse.json(data);
});
