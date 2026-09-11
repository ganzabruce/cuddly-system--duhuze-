import type { Metadata } from "next";
import { generateOrganizerProfileMetadata, renderOrganizerProfilePage } from "@/components/public-profile/organizer-profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return generateOrganizerProfileMetadata(username);
}

export default async function OrganizerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return renderOrganizerProfilePage(username);
}
